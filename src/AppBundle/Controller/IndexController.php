<?php

namespace AppBundle\Controller;

use AppBundle\Service\DecklistManager;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

class IndexController extends Controller
{
    /**
     * @param Request                $request
     * @param EntityManagerInterface $entityManager
     * @param DecklistManager        $decklistManager
     * @return Response
     * @throws \Doctrine\DBAL\DBALException
     */
    public function indexAction(
        Request $request,
        EntityManagerInterface $entityManager,
        DecklistManager $decklistManager
    ) {
        $response = new Response();
        $response->setPublic();
        $response->setMaxAge($this->getParameter("short_cache"));

        // featured decklist
        $dbh = $entityManager->getConnection();
        $rows = $dbh
            ->executeQuery("SELECT decklist FROM highlight WHERE id=?", [1])
            ->fetchAll();
        $decklist = count($rows) ? json_decode($rows[0]["decklist"]) : null;

        // TODO(plural): Remove this lookup once the DOTW contains UUID by default.
        if ($decklist != null) {
            $decklist_object = $entityManager
                ->getRepository("AppBundle:Decklist")
                ->find($decklist->{'id'});
            $decklist->{'uuid'} = $decklist_object->getUuid();
        }

        return $this->render(
            "Default/index.html.twig",
            [
                "pagetitle" => "Worldbreakers Cards and Deckbuilder",
                "pagedescription" =>
                    "Build your deck for Worldbreakers. Browse the cards and the thousand of decklists submitted by the community. Publish your own decks and get feedback.",
                "decklist" => $decklist,
                "url" => $request->getRequestUri(),
            ],

            $response
        );
    }
}
