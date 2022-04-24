<?php

namespace AppBundle\Command;

use AppBundle\Service\DecklistManager;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Bundle\FrameworkBundle\Command\ContainerAwareCommand;

class UpdateDecklistsGuildDistributions extends ContainerAwareCommand
{
    /** @var EntityManagerInterface $entityManager */
    private $entityManager;

    public function __construct(EntityManagerInterface $entityManager)
    {
        parent::__construct();
        $this->entityManager = $entityManager;
    }

    protected function configure()
    {
        $this->setName("app:decklists:guilds")
            ->setDescription("Update the guild distribution of a decklist.")
            ->addArgument("id", InputArgument::REQUIRED, "Id of the decklist");
    }

    protected function execute(InputInterface $input, OutputInterface $output)
    {
        $decklistId = $input->getArgument("id");
        $decklist = $this->entityManager
            ->getRepository("AppBundle:Decklist")
            ->findOneBy(["id" => $decklistId]);

        if (!$decklist) {
            $output->writeln("<error>Decklist does not exist.</error>");
            return;
        }
        $deck = $decklist->getParent();
        if (!$deck) {
            $output->writeln("<error>Deck of decklist does not exist.</error>");
            return;
        }
        $distribution = $deck->getGuildDistribution();
        $decklist->setGuildDistribution($distribution);
        $this->entityManager->persist($decklist);
        $this->entityManager->flush();

        $output->writeln("<info>Done</info>");
    }
}
