<?php

namespace App\Middleware;

use Psr\Container\ContainerInterface as Container;
use Psr\Http\Message\{
    ResponseInterface as Response, ServerRequestInterface as Request
};

class UserNotLoggedInMiddleware {
    private $container;

    public function __construct(Container $container) {
        $this->container = $container;
    }

    public function __invoke(Request $request, Response $response, callable $next): Response {
        if ($this->container->get('auth'))
            return $this->stop($request, $response);

        return $next($request, $response);
    }

    public function stop(Request $request, Response $response): Response {
        if ($request->getAttribute('api'))
            return $this->container->get('o')->addResponse($response)->err('authentication error', [ 'You have to be logged out to access this resource' ]);

        return $response->withRedirect($this->container->get('router')->pathFor('home'));
    }
}