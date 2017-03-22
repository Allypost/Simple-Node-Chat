<?php

namespace App\Action;

use Psr\Container\ContainerInterface;
use Slim\Http\Request;
use Slim\Http\Response;

final class HomeAction {

    private $view;
    private $auth;
    private $container;

    public function __construct(ContainerInterface $container) {
        $this->container = $container;
        $this->view      = $container->get('view');
        $this->auth      = $container->get('auth');
    }

    public function auth(Request $request, Response $response, $args) {
        return $response->withJson($args);
    }

    public function login(Request $request, Response $response) {
        $this->view->render($response, 'login.twig');

        return $response;
    }

    public function chat(Request $request, Response $response) {
        $this->view->render($response, 'index.twig');

        return $response;
    }

    public function home(Request $request, Response $response) {
        return $this->chat($request, $response);
    }
}