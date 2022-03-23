<?php

namespace AppBundle\Service;

use AppBundle\Behavior\Entity\SlotInterface;
use AppBundle\Entity\Decklist;
use AppBundle\Entity\Decklistslot;
use AppBundle\Entity\Deckslot;
use AppBundle\Entity\Card;
use Doctrine\ORM\EntityManagerInterface;

class Judge
{
    private const DECKSIZE = 30;

    /** @var EntityManagerInterface $entityManager */
    private $entityManager;

    public function __construct(EntityManagerInterface $entityManager)
    {
        $this->entityManager = $entityManager;
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

            if ($card->isSignatureCard() && $card->getSignature() !== $identity->getSignature()) {
                $problem = 'signature';
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
            case 'signature':
                return "The deck contains signature cards not belonging to the this deck's Worldbreaker.";
                break;
        }

        return null;
    }
}
