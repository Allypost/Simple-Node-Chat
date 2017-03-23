<?php

namespace App\Middleware;

use Psr\Container\ContainerInterface as Container;
use Psr\Http\Message\{
    ResponseInterface as Response, ServerRequestInterface as Request
};

class MarkAPIMiddleware {
    private $container;

    public function __construct(Container $container) {
        $this->container = $container;
    }

    public function __invoke(Request $request, Response $response, callable $next): Response {
        return $next($request->withAttribute('api', TRUE), $response);
    }
}