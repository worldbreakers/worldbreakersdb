<?php

namespace AppBundle\Service;

use AppBundle\Behavior\Entity\SlotInterface;
use AppBundle\Entity\Decklist;
use AppBundle\Entity\Decklistslot;
use AppBundle\Entity\Deckslot;
use AppBundle\Entity\Legality;
use AppBundle\Entity\Mwl;
use AppBundle\Entity\Card;
use Doctrine\ORM\EntityManagerInterface;

class Judge
{
    private const DECKSIZE = 30;

    /** @var EntityManagerInterface $entityManager */
    private $entityManager;

    /** @var array $mwlCards */
    private $mwlCards;

    public function __construct(EntityManagerInterface $entityManager)
    {
        $this->entityManager = $entityManager;
        $this->mwlCards = [];
    }

    /**
     * @param Card $card
     * @param Mwl $mwl
     */
    private function getModifiedCard(Card $card, Mwl $mwl)
    {
        if (isset($this->mwlCards[$mwl->getId()]) && isset($this->mwlCards[$mwl->getId()][$card->getCode()])) {
            return $this->mwlCards[$mwl->getId()][$card->getCode()];
        }

        $modifiedCard = $card;

        if (array_key_exists($card->getCode(), $mwl->getCards())) {
            $modificationData = $mwl->getCards()[$card->getCode()];
            $modifiedCard = clone($card);
            foreach ($modificationData as $modificationKey => $modificationValue) {
                $setter = 'set' . $this->getTrainCase($modificationKey);
                $modifiedCard->$setter($modificationValue);
            }
        }

        $this->mwlCards[$mwl->getId()][$card->getCode()] = $modifiedCard;

        return $modifiedCard;
    }

    private function getTrainCase(string $string)
    {
        return implode('', array_map(function ($segment) {
            return ucfirst($segment);
        }, explode('_', $string)));
    }

    /**
     * Decoupe un deckcontent pour son affichage par type
     *
     * @param \AppBundle\Entity\Card $identity
     */
    public function classe(array $slots, Card $identity)
    {
        $analyse = $this->analyse($slots);

        $classeur = [];
        /** @var Deckslot $slot */
        foreach ($slots as $slot) {
            /** @var Card $card */
            $card = $slot->getCard();
            $qty = $slot->getQuantity();
            $elt = ['card' => $card, 'qty' => $qty];
            $type = $card->getType()->getName();
            if ($type == "Identity") {
                continue;
            }
            $elt['faction'] = str_replace(' ', '-', mb_strtolower($card->getFaction()->getName()));

            if (!isset($classeur[$type])) {
                $classeur[$type] = ["qty" => 0, "slots" => []];
            }
            $classeur[$type]["slots"][] = $elt;
            $classeur[$type]["qty"] += $qty;
        }

        $classeur = array_merge($classeur, $analyse);

        if (isset($analyse['problem'])) {
            $classeur['problem'] = $this->problem($analyse);
        }

        return $classeur;
    }

    public function countCards(array $slots, bool $skipIdentity = false)
    {
        return array_reduce($slots, function ($carry, SlotInterface $item) use ($skipIdentity) {
            if ($skipIdentity && $item->getCard()->getType()->getName() === 'Identity') {
                return $carry;
            }

            return $carry + $item->getQuantity();
        }, 0);
    }

    /**
     * @param SlotInterface[] $slots
     * @return array|string
     */
    public function analyse(array $slots)
    {
        $identity = null;
        $deckSize = 0;
        $restricted = false;
        $problem = null;

        /** @var SlotInterface $slot */
        foreach ($slots as $slot) {
            $card = $slot->getCard();
            $qty = $slot->getQuantity();
            if ($card->getType()->getName() == "Identity") {
                if (isset($identity)) {
                    $problem = 'identities';
                }
                $identity = $card;
            } else {
                $deckSize += $qty;
            }
        }

        if ($identity === null) {
            $problem = 'identity';
        }

        if ($deckSize != self::DECKSIZE) {
            $problem = 'deckSize';
        }

        /** @var SlotInterface $slot */
        foreach ($slots as $slot) {
            $card = $slot->getCard();
            $qty = $slot->getQuantity();

            if ($card->getType()->getCode() === "identity") {
                continue;
            }

            if ($qty > 1) {
                $problem = 'copies';
            }

            if ($card->isRestricted()) {
                if ($restricted) {
                    $problem = 'restricted';
                }
                $restricted = true;
            }
        }

        $result = [
            'deckSize' => $deckSize,
        ];

        if (isset($problem)) {
            $result['problem'] = $problem;
        }

        return $result;
    }

    public function problem($analyse)
    {
        switch ($analyse['problem']) {
            case 'identity':
                return "The deck lacks a Worldbreaker card.";
                break;
            case 'identities':
                return "The deck has more than 1 Worldbreaker card;";
                break;
            case 'deckSize':
                return "The deck does not have exactly " . self::DECKSIZE . " cards.";
                break;
            case 'forbidden':
                return "The deck includes forbidden cards.";
                break;
            case 'copies':
                return "The deck has too many copies of a card.";
                break;
        }

        return null;
    }

    /**
     * computing whether Legality.decklist is legal under Legality.mwl
     *
     * @param Legality $legality
     * @return bool
     */
    public function computeLegality(Legality $legality)
    {
        /** @var SlotInterface[] $slots */
        $slots = [];

        foreach ($legality->getDecklist()->getSlots() as $slot) {
            $modifiedSlot = new Decklistslot();
            $modifiedSlot->setQuantity($slot->getQuantity());
            $modifiedSlot->setCard($this->getModifiedCard($slot->getCard(), $legality->getMwl()));
            $slots[] = $modifiedSlot;
        }

        $analyse = $this->analyse($slots);

        $legality->setIsLegal(!isset($analyse['problem']));

        return $legality->getIsLegal();
    }
}
