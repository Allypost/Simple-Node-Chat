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
            return $response->withRedirect($this->container->get('router')->pathFor('home'));

        return $next($request, $response);
    }
}