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

    public function auth(Request $request, Response $response) {
        $data = $request->getParsedBody();

        $o = $this->container->get('o')->addResponse($response);
        $u = $this->container->get('user');

        $identifier = $data[ 'identifier' ] ?? '';
        $password   = $data[ 'password' ] ?? '';

        $login = $u->login($identifier, $password, TRUE);

        if ($login[ 'status' ] !== 'ok')
            return $o->err('authentication login', [ 'errors' => [ $login[ 'error' ] ] ]);

        return $o->say('authentication login', [ $login[ 'data' ] ]);
    }

    public function logout(Request $request, Response $response) {
        $container = $this->container;

        $user = $container->get('auth');

        $user->addContainer($container, TRUE)->logout();

        return $response->withRedirect($container->get('router')->pathFor('home'));
    }

    public function login(Request $request, Response $response) {
        $this->view->render($response, 'login.twig');

        return $response;
    }

    public function chat(Request $request, Response $response) {
        $this->view->render($response, 'chat.twig', [ 'user' => $this->auth ]);

        return $response;
    }

    public function home(Request $request, Response $response) {
        return $this->auth ? $this->chat($request, $response) : $this->login($request, $response);
    }
}