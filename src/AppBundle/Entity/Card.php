<?php

namespace AppBundle\Entity;

use AppBundle\Behavior\Entity\NormalizableInterface;
use AppBundle\Behavior\Entity\TimestampableInterface;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;

/**
 * Card
 */
class Card implements NormalizableInterface, TimestampableInterface
{
    /**
     * @var integer
     */
    private $id;

    /**
     * @var \DateTime
     */
    private $dateUpdate;

    /**
     * @var string
     */
    private $code;

    /**
     * @var string
     */
    private $title;

    /**
     * @var string
     */
    private $strippedTitle;

    /**
     * @var string|null
     */
    private $keywords;

    /**
     * @var string
     */
    private $text;

    /**
     * @var string
     */
    private $strippedText;

    /**
     * @var integer|null
     */
    private $cost;

    /**
     * @var string|null
     */
    private $flavor;

    /**
     * @var string
     */
    private $illustrator;

    /**
     * @var integer
     */
    private $position;

    /**
     * @var integer|null
     */
    private $strength;

    /**
     * @var integer|null
     */
    private $health;

    /**
     * @var array|null
     */
    private $standing;

    /**
     * @var integer|null
     */
    private $standingReq;

    /**
     * @var string
     */
    private $signature;

    /**
     * @var string[]
     */
    private $stages;

    /**
     * @var Collection
     */
    private $decklists;

    /**
     * @var Pack
     */
    private $pack;

    /**
     * @var Type
     */
    private $type;

    /**
     * @var Faction
     */
    private $faction;

    /**
     * @var string|null
     */
    private $imageUrl;

    /**
     * @var Collection
     */
    private $reviews;

    /**
     * @var Collection
     */
    private $rulings;

    /**
     * @var \DateTime
     */
    private $dateCreation;

    /**
     * @var int|null
     */
    private $globalPenalty;

    /**
     * @var bool
     */
    private $isRestricted;

    /**
     * Constructor
     */
    public function __construct()
    {
        $this->decklists = new ArrayCollection();
        $this->dateUpdate = new \DateTime();
    }

    /**
     * @return string
     */
    public function __toString()
    {
        return $this->code . ' ' . $this->title;
    }

    /**
     * @return array
     */
    public function normalize()
    {
        if (empty($this->code)) {
            return [];
        }

        $normalized = [];

        $mandatoryFields = [
                'code',
                'title',
                'stripped_title',
                'position',
        ];

        $optionalFields = [
                'illustrator',
                'flavor',
                'keywords',
                'text',
                'stripped_text',
                'cost',
                'image_url',
                'stages',
                'standing',
                'standing_req',
                'strength',
                'health',
                'signature',
        ];

        $externalFields = [
                'faction',
                'pack',
                'type'
        ];

        foreach ($optionalFields as $optionalField) {
            $getter = $this->snakeToCamel('get_' . $optionalField);
            $normalized[$optionalField] = $this->$getter();

            if (!isset($normalized[$optionalField]) || $normalized[$optionalField] === '') {
                unset($normalized[$optionalField]);
            }
        }

        foreach ($mandatoryFields as $mandatoryField) {
            $getter = $this->snakeToCamel('get_' . $mandatoryField);
            $normalized[$mandatoryField] = $this->$getter();
        }

        foreach ($externalFields as $externalField) {
            $getter = $this->snakeToCamel('get_' . $externalField);
            $normalized[$externalField.'_code'] = $this->$getter()->getCode();
        }

        ksort($normalized);
        return $normalized;
    }

    /**
     * @param string $snake
     * @return string
     */
    private function snakeToCamel(string $snake)
    {
        $parts = explode('_', $snake);
        return implode('', array_map('ucfirst', $parts));
    }

    /**
     * @return int
     */
    public function getId()
    {
        return $this->id;
    }

    /**
     * @return \DateTime
     */
    public function getDateUpdate()
    {
        return $this->dateUpdate;
    }

    /**
     * @param \DateTime $dateUpdate
     * @return $this
     */
    public function setDateUpdate(\DateTime $dateUpdate)
    {
        $this->dateUpdate = $dateUpdate;

        return $this;
    }

    /**
     * @return string
     */
    public function getCode()
    {
        return $this->code;
    }

    /**
     * @param string $code
     * @return $this
     */
    public function setCode(string $code)
    {
        $this->code = $code;

        return $this;
    }

    /**
     * @return string
     */
    public function getTitle()
    {
        return $this->title;
    }

    /**
     * @param string $title
     * @return $this
     */
    public function setTitle(string $title)
    {
        $this->title = $title;

        return $this;
    }

    /**
     * @return string
     */
    public function getStrippedTitle()
    {
        return $this->strippedTitle;
    }

    /**
     * @param string $title
     * @return $this
     */
    public function setStrippedTitle(string $title)
    {
        $this->strippedTitle = $title;

        return $this;
    }

    /**
     * @return string|null
     */
    public function getKeywords()
    {
        return $this->keywords;
    }

    /**
     * @param string|null $keywords
     * @return $this
     */
    public function setKeywords(string $keywords = null)
    {
        $this->keywords = $keywords;

        return $this;
    }

    /**
     * @return string
     */
    public function getText()
    {
        return $this->text;
    }

    /**
     * @param string $text
     * @return $this
     */
    public function setText(string $text)
    {
        $this->text = $text;

        return $this;
    }

    /**
     * @return string
     */
    public function getStrippedText()
    {
        return $this->strippedText;
    }

    /**
     * @param string|null $text
     * @return $this
     */
    public function setStrippedText(string $text = null)
    {
        $this->strippedText = $text;

        return $this;
    }

    /**
     * @return int|null
     */
    public function getCost()
    {
        return $this->cost;
    }

    /**
     * @param int|null $cost
     * @return $this
     */
    public function setCost(int $cost = null)
    {
        $this->cost = $cost;

        return $this;
    }

    /**
     * @return string|null
     */
    public function getFlavor()
    {
        return $this->flavor;
    }

    /**
     * @param string|null $flavor
     * @return $this
     */
    public function setFlavor(string $flavor = null)
    {
        $this->flavor = $flavor;

        return $this;
    }

    /**
     * @return string
     */
    public function getIllustrator()
    {
        return $this->illustrator;
    }

    /**
     * @param string $illustrator
     * @return $this
     */
    public function setIllustrator(string $illustrator)
    {
        $this->illustrator = $illustrator;

        return $this;
    }

    /**
     * @return int
     */
    public function getPosition()
    {
        return $this->position;
    }

    /**
     * @param int $position
     * @return $this
     */
    public function setPosition(int $position)
    {
        $this->position = $position;

        return $this;
    }

    /**
     * @return int
     */
    public function getStrength()
    {
        return $this->strength;
    }

    /**
     * @param int $strength
     * @return $this
     */
    public function setStrength(int $strength)
    {
        $this->strength = $strength;

        return $this;
    }

    /**
     * @return int
     */
    public function getHealth()
    {
        return $this->health;
    }

    /**
     * @param int $health
     * @return $this
     */
    public function setHealth(int $health)
    {
        $this->health = $health;

        return $this;
    }

    /**
     * @return array
     */
    public function getStanding()
    {
        return $this->standing;
    }

    /**
     * @param array $standing
     * @return $this
     */
    public function setStanding(array $standing)
    {
        $this->standing = $standing;

        return $this;
    }

    /**
     * @return int
     */
    public function getStandingReq()
    {
        return $this->standingReq;
    }

    /**
     * @param int $standingReq
     * @return $this
     */
    public function setStandingReq(int $standingReq)
    {
        $this->standingReq = $standingReq;

        return $this;
    }

    /**
     * @return array
     */
    public function getStages()
    {
        return $this->stages;
    }

    /**
     * @param array $stages
     * @return $this
     */
    public function setStages(array $stages)
    {
        $this->stages = $stages;

        return $this;
    }

    /**
     * @return string
     */
    public function getSignature()
    {
        return $this->signature;
    }

    /**
     * @param string $signature
     * @return $this
     */
    public function setSignature(string $signature)
    {
        $this->signature = $signature;

        return $this;
    }

    /**
     * @return bool
     */
    public function isSignatureCard()
    {
        if ($this->getType()->getCode() === 'identity') {
            return false;
        }

        return is_string($this->signature) && strlen($this->signature);
    }

    /**
     * @param Decklist $decklists
     * @return $this
     */
    public function addDecklist(Decklist $decklists)
    {
        $this->decklists[] = $decklists;

        return $this;
    }

    /**
     * @param Decklist $decklists
     */
    public function removeDecklist(Decklist $decklists)
    {
        $this->decklists->removeElement($decklists);
    }

    /**
     * @return ArrayCollection|Collection
     */
    public function getDecklists()
    {
        return $this->decklists;
    }

    /**
     * @return Pack
     */
    public function getPack()
    {
        return $this->pack;
    }

    /**
     * @param Pack $pack
     * @return $this
     */
    public function setPack(Pack $pack)
    {
        $this->pack = $pack;

        return $this;
    }

    /**
     * @param Review $reviews
     * @return $this
     */
    public function addReview(Review $reviews)
    {
        $this->reviews[] = $reviews;

        return $this;
    }

    /**
     * @param Review $reviews
     */
    public function removeReview(Review $reviews)
    {
        $this->reviews->removeElement($reviews);
    }

    /**
     * @return Collection
     */
    public function getReviews()
    {
        return $this->reviews;
    }

    /**
     * @param Ruling $rulings
     * @return $this
     */
    public function addRuling(Ruling $rulings)
    {
        $this->rulings[] = $rulings;

        return $this;
    }

    /**
     * @param Ruling $rulings
     */
    public function removeRuling(Ruling $rulings)
    {
        $this->rulings->removeElement($rulings);
    }

    /**
     * @return Collection
     */
    public function getRulings()
    {
        return $this->rulings;
    }

    /**
     * @return Type
     */
    public function getType()
    {
        return $this->type;
    }

    /**
     * @param Type $type
     * @return $this
     */
    public function setType(Type $type)
    {
        $this->type = $type;

        return $this;
    }

    /**
     * @return bool
     */
    public function isIdentity()
    {
        return $this->getType()->getCode() === 'identity';
    }

    /**
     * @return Faction
     */
    public function getFaction()
    {
        return $this->faction;
    }

    /**
     * @param Faction $faction
     * @return $this
     */
    public function setFaction(Faction $faction)
    {
        $this->faction = $faction;

        return $this;
    }

    /**
     * @return \DateTime
     */
    public function getDateCreation()
    {
        return $this->dateCreation;
    }

    /**
     * @param \DateTime $dateCreation
     * @return $this
     */
    public function setDateCreation(\DateTime $dateCreation)
    {
        $this->dateCreation = $dateCreation;

        return $this;
    }

    /**
     * @return int|null
     */
    public function getGlobalPenalty()
    {
        return $this->globalPenalty;
    }

    /**
     * @param int|null $globalPenalty
     * @return $this
     */
    public function setGlobalPenalty(int $globalPenalty = null)
    {
        $this->globalPenalty = $globalPenalty;

        return $this;
    }

    /**
     * @return bool
     */
    public function isRestricted()
    {
        return $this->isRestricted;
    }

    /**
     * @param bool $isRestricted
     * @return $this
     */
    public function setIsRestricted(bool $isRestricted)
    {
        $this->isRestricted = $isRestricted;

        return $this;
    }

    /**
     * @return string[]
     */
    public function getTinyImagePaths()
    {
        return $this->getImagePaths('tiny');
    }

    /**
     * @return string[]
     */
    public function getSmallImagePaths()
    {
        return $this->getImagePaths('small');
    }

    /**
     * @return string[]
     */
    public function getMediumImagePaths()
    {
        return $this->getImagePaths('medium');
    }

    /**
     * @return string[]
     */
    public function getLargeImagePaths()
    {
        return $this->getImagePaths('large');
    }

    private function getImagePaths($size)
    {
        if ($this->isIdentity()) {
            return [ $this->getImagePath($size, '_front'), $this->getImagePath($size, '_back') ];
        }

        return [ $this->getImagePath($size, ''), null ];
    }

    private function getImagePath($size, $side)
    {
        return '/' . $size . '/' . $this->code . $side . '.jpg';
    }

    /**
     * @return null|string
     */
    public function getImageUrl()
    {
        return $this->imageUrl;
    }

    /**
     * @param string|null $imageUrl
     * @return $this
     */
    public function setImageUrl(string $imageUrl = null)
    {
        $this->imageUrl = $imageUrl;

        return $this;
    }

    /**
     * @return string
     */
    public function getFormattedType()
    {
        $formattedType = "<strong>" . $this->type;
        $subtypes = $this->getKeywords();
        if (!is_null($subtypes)) {
            $formattedType .= ":</strong> " . $subtypes;
        } else {
            $formattedType .= "</strong>";
        }
        return $formattedType;
    }

    /**
     * @return string
     */
    public function getFormattedCost()
    {
        $cost = $this->getCost();
        if (is_null($cost) && $this->getType()->getCode() != "identity") {
            $cost = 'X';
        }
        return $cost . '<svg class="icon-wb icon-mythium" aria-hidden="true"><use xlink:href="#icon-mythium"></use></svg><span class="icon-fallback">Mythium</span>';
    }
}
