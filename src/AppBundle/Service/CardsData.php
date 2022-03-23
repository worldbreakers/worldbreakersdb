<?php

namespace AppBundle\Service;

use AppBundle\Entity\Card;
use AppBundle\Entity\Pack;
use AppBundle\Entity\Review;
use AppBundle\Entity\Ruling;
use AppBundle\Service\Illustrators;
use AppBundle\Repository\PackRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Asset\Packages;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;
use Symfony\Component\Routing\RouterInterface;

class CardsData
{
    public static $faction_shortcuts = [
        '-'       => 'neutral',

        'e'       => 'earth',
        'm'       => 'moon',
        's'       => 'stars',
        'v'       => 'void',
    ];

    /** @var EntityManagerInterface $entityManager */
    private $entityManager;

    /** @var PackRepository $packRepository */
    private $packRepository;

    /** @var RouterInterface $router */
    private $router;

    /** @var Packages $packages */
    private $packages;

    /** @var Illustrators $illustrators */
    private $illustrators;

    public function __construct(
        EntityManagerInterface $entityManager,
        RepositoryFactory $repositoryFactory,
        RouterInterface $router,
        Packages $packages,
        Illustrators $illustrators
    ) {
        $this->entityManager = $entityManager;
        $this->packRepository = $repositoryFactory->getPackRepository();
        $this->router = $router;
        $this->packages = $packages;
        $this->illustrators = $illustrators;
    }

    /**
     * Searches for and replaces symbol tokens with markup in a given text.
     * @param string $text
     * @return string
     */
    public function replaceSymbols(string $text)
    {
        $map = [
            '[mythium]' => '<svg class="icon-wb icon-mythium" aria-hidden="true"><use xlink:href="#icon-mythium"></use></svg><span class="icon-fallback">Mythium</span>',
            '[earth]' => '<svg class="icon-wb icon-earth"><use xlink:href="#icon-earth"></use></svg><span class="icon-fallback">Earth Guild</span>',
            '[moon]' => '<svg class="icon-wb icon-moon"><use xlink:href="#icon-moon"></use></svg><span class="icon-fallback">Moon Guild</span>',
            '[stars]' => '<svg class="icon-wb icon-stars"><use xlink:href="#icon-stars"></use></svg><span class="icon-fallback">Stars Guild</span>',
            '[void]' => '<svg class="icon-wb icon-void"><use xlink:href="#icon-void"></use></svg><span class="icon-fallback">Void Guild</span>',
        ];

        return str_replace(array_keys($map), array_values($map), $text);
    }

    public function allsetsdata()
    {
        $list_packs = $this->packRepository->findBy([], ["dateRelease" => "ASC", "position" => "ASC"]);
        $packs = [];
        foreach ($list_packs as $pack) {
            $real = $pack->getCards()->count();
            $max = $pack->getSize();
            $packs[] = [
                "name"      => $pack->getName(),
                "code"      => $pack->getCode(),
                "number"    => $pack->getPosition(),
                "available" => $pack->getDateRelease() ? $pack->getDateRelease()->format('Y-m-d') : '',
                "known"     => intval($real),
                "total"     => $max,
                "url"       => $this->router->generate('cards_list', ['pack_code' => $pack->getCode()], UrlGeneratorInterface::ABSOLUTE_URL),
                "search"    => "e:" . $pack->getCode(),
            ];
        }

        return $packs;
    }

    public function getPacks(array $pack_codes = [])
    {
        $packs = [];
        $list_packs = $this->entityManager->getRepository('AppBundle:Pack')->findBy([], ["position" => "DESC"]);
        foreach ($list_packs as $pack) {
            $num_packs_on = 0;
            $checked = count($pack_codes) > 0 ? in_array($pack->getCode(), $pack_codes) : $pack->getDateRelease() !== null;
            if ($checked) {
                ++$num_packs_on;
            }
            $packs[] = ["code" => $pack->getCode(), "label" => $pack->getName(), "checked" => $checked, "future" => $pack->getDateRelease() === null];
        }
        return $packs;
    }

    public function get_search_rows(array $conditions, string $sortorder, string $locale)
    {
        $i = 0;

        // Construction of the sql request
        $init = $this->entityManager->createQueryBuilder();
        $qb = $init->select('c', 'p', 't', 'g')
           ->from(Card::class, 'c')
           ->leftJoin('c.pack', 'p')
           ->leftJoin('c.type', 't')
           ->leftJoin('c.faction', 'g');

        $qb2 = null;
        $qb3 = null;
        $clauses = [];
        $parameters = [];

        foreach ($conditions as $condition) {
            $type = array_shift($condition);
            $operator = array_shift($condition);
            switch ($type) {
                case '_': // title or index
                    $or = [];
                    foreach ($condition as $arg) {
                        $code = preg_match('/^\d\d\d\d\d$/u', $arg);
                        $acronym = preg_match('/^[A-Z]{2,}$/', $arg);
                        if ($code) {
                            $or[] = "(c.code " . ($operator == ":" ? "=" : "!=") . " ?$i)";
                            $parameters[$i++] = $arg;
                        } elseif ($acronym) {
                            $cond = [];
                            $cond[] = "(BINARY(c.title) like ?$i)";
                            $parameters[$i++] = "%$arg%";
                            $like = implode('% ', str_split($arg));
                            $cond[] = "(REPLACE(c.title, '-', ' ') like ?$i)";
                            $parameters[$i++] = "$like%";
                            $cond[] = "(c.strippedTitle like ?$i)";
                            $parameters[$i++] = "$like%";
                            if ($operator == ":") {
                                $or[] = implode ("or", $cond);
                            } else {
                                $or[] = "not (" . implode ("or", $cond) . ")";
                            }
                        } else {
                            $or[] = "(c.title " . ($operator == ":" ? "like" : "not like") . " ?$i)";
                            $parameters[$i++] = "%$arg%";
                        }
                    }
                    $clauses[] = implode(" or ", $or);
                    break;
                case 'x': // text
                    $or = [];
                    foreach ($condition as $arg) {
                        switch ($operator) {
                            case ':':
                                $or[] = "(c.strippedText like ?$i)";
                                break;
                            case '!':
                                $or[] = "(c.strippedText not like ?$i)";
                                break;
                        }
                        $parameters[$i++] = "%$arg%";
                    }
                    $clauses[] = implode($operator == '!' ? " and " : " or ", $or);
                    break;
                case 'a': // flavor
                    $or = [];
                    foreach ($condition as $arg) {
                        switch ($operator) {
                            case ':':
                                $or[] = "(c.flavor like ?$i)";
                                break;
                            case '!':
                                $or[] = "(c.flavor not like ?$i)";
                                break;
                        }
                        $parameters[$i++] = "%$arg%";
                    }
                    $clauses[] = implode($operator == '!' ? " and " : " or ", $or);
                    break;
                case 'e': // extension (pack)
                    $or = [];
                    foreach ($condition as $arg) {
                        switch ($operator) {
                            case ':':
                                $or[] = "(p.code = ?$i)";
                                break;
                            case '!':
                                $or[] = "(p.code != ?$i)";
                                break;
                            case '<':
                                if (!isset($qb2)) {
                                    $qb2 = $this->entityManager->createQueryBuilder()->select('p2')->from(Pack::class, 'p2');
                                    $or[] = $qb->expr()->lt('p.dateRelease', '(' . $qb2->select('p2.dateRelease')->where("p2.code = ?$i")->getDQL() . ')');
                                }
                                break;
                            case '>':
                                if (!isset($qb3)) {
                                    $qb3 = $this->entityManager->createQueryBuilder()->select('p3')->from(Pack::class, 'p3');
                                    $or[] = $qb->expr()->gt('p.dateRelease', '(' . $qb3->select('p3.dateRelease')->where("p3.code = ?$i")->getDQL() . ')');
                                }
                                break;
                        }
                        $parameters[$i++] = $arg;
                    }
                    $clauses[] = implode($operator == '!' ? " and " : " or ", $or);
                    break;
                case 't': // type
                    $or = [];
                    foreach ($condition as $arg) {
                        switch ($operator) {
                            case ':':
                                $or[] = "(t.code = ?$i)";
                                break;
                            case '!':
                                $or[] = "(t.code != ?$i)";
                                break;
                        }
                        $parameters[$i++] = $arg;
                    }
                    $clauses[] = implode($operator == '!' ? " and " : " or ", $or);
                    break;
                case 'g': // guild
                    $or = [];
                    foreach ($condition as $arg) {
                        switch ($operator) {
                            case ':':
                                $or[] = "(g.code = ?$i)";
                                break;
                            case '!':
                                $or[] = "(g.code != ?$i)";
                                break;
                        }
                        $parameters[$i++] = $arg;
                    }
                    $clauses[] = implode($operator == '!' ? " and " : " or ", $or);
                    break;
                case 's': // subtype (keywords)
                    $or = [];
                    foreach ($condition as $arg) {
                        switch ($operator) {
                            case ':':
                                $or[] = "((c.keywords = ?$i) or (c.keywords like ?" . ($i + 1) . ") or (c.keywords like ?" . ($i + 2) . ") or (c.keywords like ?" . ($i + 3) . "))";
                                $parameters[$i++] = "$arg";
                                $parameters[$i++] = "$arg %";
                                $parameters[$i++] = "% $arg";
                                $parameters[$i++] = "% $arg %";
                                break;
                            case '!':
                                $or[] = "(c.keywords is null or ((c.keywords != ?$i) and (c.keywords not like ?" . ($i + 1) . ") and (c.keywords not like ?" . ($i + 2) . ") and (c.keywords not like ?" . ($i + 3) . ")))";
                                $parameters[$i++] = "$arg";
                                $parameters[$i++] = "$arg %";
                                $parameters[$i++] = "% $arg";
                                $parameters[$i++] = "% $arg %";
                                break;
                        }
                    }
                    $clauses[] = implode($operator == '!' ? " and " : " or ", $or);
                    break;
                case 'i': // illustrator
                    $or = [];
                    foreach ($condition as $arg) {
                        switch ($operator) {
                            case ':':
                                $or[] = "(c.illustrator like ?$i)";
                                break;
                            case '!':
                                $or[] = "(c.illustrator not like ?$i)";
                                break;
                        }
                        $parameters[$i++] = "%$arg%";
                    }
                    $clauses[] = implode($operator == '!' ? " and " : " or ", $or);
                    break;
                case 'o': // cost
                    $or = [];
                    foreach ($condition as $arg) {
                        if (($arg === 'x') or ($arg === 'X')) {
                            switch ($operator) {
                                case ':':
                                    $or[] = "(c.cost is null and (t.code not in ('identity')))";
                                    break;
                                case '!':
                                    $or[] = "(c.cost is not null)";
                                    break;
                            }
                        } else {
                            switch ($operator) {
                                case ':':
                                    $or[] = "(c.cost = ?$i)";
                                    break;
                                case '!':
                                    $or[] = "(c.cost != ?$i)";
                                    break;
                                case '<':
                                    $or[] = "(c.cost < ?$i)";
                                    break;
                                case '>':
                                    $or[] = "(c.cost > ?$i)";
                                    break;
                            }
                            $parameters[$i++] = $arg;
                        }
                    }
                    $clauses[] = implode($operator == '!' ? " and " : " or ", $or);
                    break;
                case 'p': // strength
                    $or = [];
                    foreach ($condition as $arg) {
                        switch ($operator) {
                            case ':':
                                $or[] = "(c.strength = ?$i)";
                                break;
                            case '!':
                                $or[] = "(c.strength != ?$i)";
                                break;
                            case '<':
                                $or[] = "(c.strength < ?$i)";
                                break;
                            case '>':
                                $or[] = "(c.strength > ?$i)";
                                break;
                        }
                        $parameters[$i++] = $arg;
                    }
                    $clauses[] = implode($operator == '!' ? " and " : " or ", $or);
                    break;
                case 'h': // health
                    $or = [];
                    foreach ($condition as $arg) {
                        switch ($operator) {
                            case ':':
                                $or[] = "(c.health = ?$i)";
                                break;
                            case '!':
                                $or[] = "(c.health != ?$i)";
                                break;
                            case '<':
                                $or[] = "(c.health < ?$i)";
                                break;
                            case '>':
                                $or[] = "(c.health > ?$i)";
                                break;
                        }
                        $parameters[$i++] = $arg;
                    }
                    $clauses[] = implode($operator == '!' ? " and " : " or ", $or);
                    break;
                case 'r': // release
                    $or = [];
                    foreach ($condition as $arg) {
                        switch ($operator) {
                            case '<':
                                $or[] = "(p.dateRelease <= ?$i)";
                                break;
                            case '>':
                                $or[] = "(p.dateRelease > ?$i or p.dateRelease IS NULL)";
                                break;
                        }
                        if ($arg == "now") {
                            $parameters[$i++] = new \DateTime();
                        } else {
                            $parameters[$i++] = new \DateTime($arg);
                        }
                    }
                    $clauses[] = implode(" or ", $or);
                    break;
            }
        }

        if (count($clauses) === 0) {
            return [];
        }

        foreach ($clauses as $clause) {
            if(!empty($clause)) {
                $qb->andWhere($clause);
            }
        }
        foreach ($parameters as $index => $parameter) {
            $qb->setParameter($index, $parameter);
        }

        switch ($sortorder) {
            case 'name':
                $qb->orderBy('c.title');
                break;
            case 'set':
                $qb->orderBy('p.name')->addOrderBy('c.position');
                break;
            case 'release-date':
                $qb->orderBy('y.position')->addOrderBy('p.position')->addOrderBy('c.position');
                break;
            case 'faction':
                $qb->addOrderBy('c.faction')->addOrderBy('c.type');
                break;
            case 'type':
                $qb->addOrderBy('c.type')->addOrderBy('c.faction');
                break;
            case 'cost':
                $qb->orderBy('c.cost')->addOrderBy('c.standingReq');
                break;
            case 'standing':
                $qb->orderBy('c.standingReq')->addOrderBy('c.faction')->addOrderBy('c.cost');
                break;
            case 'strength':
                $qb->orderBy('c.strength')->addOrderBy('c.health');
                break;
            case 'health':
                $qb->orderBy('c.health')->addOrderBy('c.strength');
                break;
        }
        $query = $qb->getQuery();

        $rows = $query->getResult();

        return $rows;
    }

    /**
     * @param Card $card
     * @return array
     */
    public function getCardInfo(Card $card, string $locale)
    {
        static $cache = [];

        if (isset($cache[$card->getId()]) && isset($cache[$card->getId()][$locale])) {
            return $cache[$card->getId()][$locale];
        }

        $cardinfo = [
            "id"                => $card->getId(),
            "code"              => $card->getCode(),
            "title"             => $card->getTitle(),
            "type_name"         => $card->getType()->getName(),
            "type_code"         => $card->getType()->getCode(),
            "subtype"           => $card->getKeywords(),
            "formatted_type"    => $card->getFormattedType(),
            "text"              => $card->getText(),
            "cost"              => $card->getCost(),
            "formatted_cost"    => $card->getFormattedCost(),
            "faction_name"      => $card->getFaction()->getName(),
            "faction_code"      => $card->getFaction()->getCode(),
            "flavor"            => $card->getFlavor(),
            "illustrator"       => $card->getIllustrator(),
            "illustrators"      => $this->illustrators->split($card->getIllustrator()),
            "position"          => $card->getPosition(),
            "pack_name"         => $card->getPack()->getName(),
            "pack_code"         => $card->getPack()->getCode(),
            "strength"          => $card->getStrength(),
            "health"            => $card->getHealth(),
            "stages"            => $card->getStages(),
            "signature"         => $card->getSignature(),
            "is_signature_card" => $card->isSignatureCard(),
            "standing"          => $card->getStanding(),
            "standing_req"      => $card->getStandingReq(),
            "imageUrl"          => $card->getImageUrl(),
            "tiny_image_pats"   => $card->getTinyImagePaths(),
            "small_image_paths"  => $card->getSmallImagePaths(),
            "medium_image_paths" => $card->getMediumImagePaths(),
            "large_image_paths"  => $card->getLargeImagePaths(),
        ];

        // setting the card cost to X if the cost is null and the card is not of a costless type
        if ($cardinfo['cost'] === null && !in_array($cardinfo['type_code'], ['identity'])) {
            $cardinfo['cost'] = 'X';
        }

        $cardinfo['url'] = $this->router->generate('cards_zoom', ['card_code' => $card->getCode(), '_locale' => $locale], UrlGeneratorInterface::ABSOLUTE_URL);
        $cardinfo['imageUrl'] = $cardinfo['imageUrl'] ?: $this->packages->getUrl($card->getCode() . ".png", "card_image");

        // If the card has text
        if (strlen($cardinfo['text']) > 0) {
            $cardinfo['text'] = $this->replaceSymbols($cardinfo['text']);
            $cardinfo['text'] = str_replace('&', '&amp;', $cardinfo['text']);
            $cardinfo['text'] = implode(array_map(function ($l) {
                return "<p>$l</p>";
            }, explode("\n", $cardinfo['text'])));
        }

        // If the card has stages
        if ($cardinfo['stages']) {
            $cardinfo['stages'] = array_map(
                function ($stage) {
                    return implode(array_map(function ($l) {
                        return "<p>$l</p>";
                    }, explode("\n", str_replace(
                        '&',
                        '&amp;',
                        $this->replaceSymbols($stage)
                    ))));
                },
                array_filter($cardinfo['stages'])
            );
        }

        if (strlen($cardinfo['flavor']) > 0) {
            $cardinfo['flavor'] = $this->replaceSymbols($cardinfo['flavor']);
            $cardinfo['flavor'] = str_replace('&', '&amp;', $cardinfo['flavor']);
        }

        if ($card->isSignatureCard()) {
            $worldbreakers = array_filter(
                $this->entityManager->getRepository('AppBundle:Card')->findBy(
                    ['signature' => $card->getSignature()],
                    ['position' => 'ASC']
                ),
                function ($card) {
                    return $card->isIdentity();
                }
            );
            $cardinfo['worldbreaker'] = current($worldbreakers)->getCode();
        } elseif ($card->isIdentity()) {
            $signatureCards = array_map(
                function ($card) {
                    return [$card->getCode(), $card->getStrippedTitle()];
                },
                array_filter(
                    $this->entityManager
                        ->getRepository('AppBundle:Card')
                        ->findBy(['signature' => $card->getSignature()], ['position' => 'ASC']),
                    function ($card) {
                        return !$card->isIdentity();
                    }
                )
            );
            $cardinfo['signature_cards'] = $signatureCards;
        }

        $cardinfo['cssfaction'] = str_replace(" ", "-", mb_strtolower($card->getFaction()->getName()));

        $cache[$card->getId()][$locale] = $cardinfo;

        return $cardinfo;
    }

    public function syntax(string $query)
    {
        // returns a list of conditions (array)
        // each condition is an array with n>1 elements
        // the first is the type of condition (0 or 1 character)
        // the rest are the arguments, in OR

        $query = preg_replace('/\s+/u', ' ', trim($query));

        $list = [];
        $cond = null;
        // the automaton has 3 states:
        // 1: determine the search type (if none is found before (2) the type is empty)
        // 2: find the main argument
        // 3: check for additional arguments
        // 4: parsing error - we are looking for the next condition

        $state = 1;
        while ($query != "") {
            if ($state == 1) {
                if (isset($cond) && $state != 4 && count($cond) > 2) {
                    $list[] = $cond;
                }
                // we start by looking for a type of condition
                $match = [];
                if (preg_match('/^(\p{L}|_)([:<>!])(.*)/u', $query, $match)) { // token "condition:"
                    $cond = [mb_strtolower($match[1]), $match[2]];
                    $query = $match[3];
                } else {
                    $cond = ["_", ":"];
                }
                $state = 2;
            } else {
                if (preg_match('/^"([^"]*)"(.*)/u', $query, $match) // token "free text between quotes"
                    || preg_match('/^([\p{L}\p{N}\-\&\.\!\'\;]+)(.*)/u', $query, $match) // token "text allowed without quotes"
                ) {
                    if (($state == 2 && isset($cond) && count($cond) == 2) || $state == 3) {
                        $cond[] = $match[1];
                        $query = $match[2];
                        $state = 2;
                    } else {
                        // error
                        $query = $match[2];
                        $state = 4;
                    }
                } elseif (preg_match('/^\|(.*)/u', $query, $match)) { // token "|"
                    if (($cond[1] == ':' || $cond[1] == '!') && (($state == 2 && isset($cond) && count($cond) > 2) || $state == 3)) {
                        $query = $match[1];
                        $state = 3;
                    } else {
                        // error
                        $query = $match[1];
                        $state = 4;
                    }
                } elseif (preg_match('/^ (.*)/u', $query, $match)) { // token " "
                    $query = $match[1];
                    $state = 1;
                } else {
                    // error
                    $query = substr($query, 1);
                    $state = 4;
                }
            }
        }
        if (isset($cond) && $state != 4 && count($cond) > 2) {
            $list[] = $cond;
        }

        return $list;
    }

    public function validateConditions(array &$conditions)
    {
        // Remove invalid conditions
        $canDoNumeric = ['e', 'o', 'p', 'h', 'r', 'y'];
        $numeric = ['<', '>'];
        foreach ($conditions as $i => $l) {
            if (in_array($l[1], $numeric) && !in_array($l[0], $canDoNumeric)) {
                unset($conditions[$i]);
            }
            if ($l[0] == 'g') {
                $factions = [];
                for ($j = 2; $j < count($l); ++$j) {
                    if (array_key_exists($l[$j], self::$faction_shortcuts)) {
                        if (is_array(self::$faction_shortcuts[$l[$j]])) {
                            array_push($factions, ...self::$faction_shortcuts[$l[$j]]);
                        } else {
                            array_push($factions, self::$faction_shortcuts[$l[$j]]);
                        }
                    } else {
                        array_push($factions, $l[$j]);
                    }
                }
                array_unshift($factions, 'g', $l[1]);
                $conditions[$i] = $factions;
            }
        }
    }

    public function buildQueryFromConditions(array $conditions)
    {
        // rebuild the search string for display
        return implode(" ", array_map(
            function ($l) {
                return ($l[0] == "_" && $l[1] == ":" ? "" : $l[0] . $l[1])
                    . implode("|", array_map(
                        function ($s) {
                            return preg_match("/^[\p{L}\p{N}\-\&\.\!\'\;]+$/u", $s) ? $s : "\"$s\"";
                        },
                        array_slice($l, 2)
                    ));
            },
            $conditions
        ));
    }

    public function get_reviews(array $cards)
    {
        $reviews = $this->entityManager->getRepository(Review::class)->findBy(['card' => $cards], ['nbvotes' => 'DESC']);

        $response = [];
        $packs = $this->packRepository->findBy([], ["dateRelease" => "ASC"]);
        foreach ($reviews as $review) {
            /** @var Review $review */
            $user = $review->getUser();

            $response[] = [
                'id'                => $review->getId(),
                'text'              => $review->getText(),
                'author_id'         => $user->getId(),
                'author_name'       => $user->getUsername(),
                'author_reputation' => $user->getReputation(),
                'author_color'      => $user->getFaction(),
                'date_creation'     => $review->getDateCreation(),
                'nbvotes'           => $review->getNbvotes(),
                'comments'          => $review->getComments(),
                'latestpack'        => $this->last_pack_for_review($packs, $review),
            ];
        }

        return $response;
    }

    public function last_pack_for_review(array $packs, Review $review)
    {
        /** @var Pack $pack */
        foreach (array_reverse($packs) as $pack) {
            if ($pack->getDateRelease() instanceof \DateTime
                && $pack->getDateRelease() < $review->getDateCreation()) {
                return $pack->getName();
            }
        }

        return 'Unknown';
    }

    public function get_rulings(array $cards)
    {
        $rulings = $this->entityManager->getRepository(Ruling::class)->findBy(['card' => $cards], ['dateCreation' => 'ASC']);

        $response = [];
        foreach ($rulings as $ruling) {
            $response[] = [
                'id'      => $ruling->getId(),
                'text'    => $ruling->getText(),
                'rawtext' => $ruling->getRawtext(),
            ];
        }

        return $response;
    }

    /**
     * Searches a Identity card by its partial title
     * @return \AppBundle\Entity\Card
     */
    public function find_identity(string $partialTitle)
    {
        $qb = $this->entityManager->createQueryBuilder();
        $qb->select('c')->from('AppBundle:Card', 'c')->join('AppBundle:Type', 't', 'WITH', 'c.type = t');
        $qb->where($qb->expr()->eq('t.name', ':typeName'));
        $qb->andWhere($qb->expr()->like('c.title', ':title'));
        $query = $qb->getQuery();
        $query->setParameter('typeName', 'Identity');
        $query->setParameter('title', '%' . $partialTitle . '%');
        $card = $query->getSingleResult();

        return $card;
    }

    /**
     *  Searches for other versions/releases of all cards
     *  @return array
     */
    public function get_versions()
    {
        $cards = $this->entityManager->getRepository(Card::class)->findAll();

        $versions = [];
        foreach ($cards as $card) {
            $versions[$card->getTitle()][] = $card;
        }

        return $versions;
    }

    public function select_only_latest_cards(array $matchingCards)
    {
        $latestCardsByTitle = [];
        foreach ($matchingCards as $card) {
            $latestCard = null;
            $title = $card->getTitle();

            if (isset($latestCardsByTitle[$title])) {
                $latestCard = $latestCardsByTitle[$title];
            }
            if (!$latestCard || $card->getCode() > $latestCard->getCode()) {
                $latestCardsByTitle[$title] = $card;
            }
        }

        return array_values(array_filter($matchingCards, function ($card) use ($latestCardsByTitle) {
            return $card->getCode() == $latestCardsByTitle[$card->getTitle()]->getCode();
        }));
    }

    public function get_versions_by_code(array $cards_code)
    {
        $cards = $this->entityManager->getRepository(Card::class)->findBy(['code' => $cards_code]);
        $titles = [];
        foreach ($cards as $card) {
            $titles[] = $card->getTitle();
        }

        $qb = $this->entityManager->createQueryBuilder();
        $qb = $qb->select('c')
                 ->from(Card::class, 'c')
                 ->where('c.title in (:titles)')
                 ->setParameter('titles', $titles);
        $query = $qb->getQuery();
        $rows = $query->getResult();

        return $rows;
    }
}
