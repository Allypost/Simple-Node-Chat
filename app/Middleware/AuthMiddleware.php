<?php

namespace App\Middleware;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Slim\Container;

class AuthMiddleware {
    private $container;

    public function __construct(Container $container) {
        $this->container = $container;
    }

    public function __invoke(ServerRequestInterface $request, ResponseInterface $response, callable $next): ResponseInterface {
        $response = $next($request, $response);

        return $response;
    }

    /**
     * Get user ID from session
     */
    protected function getID() {
        $sessionKey = $this->getSessionKey();

        $id = @$_SESSION[ $sessionKey ];

        if (!$id) {
            $id = FALSE;
        }

        return $id;
    }

    /**
     * Get auth session key from configuration
     *
     * @return string The key
     */
    protected function getSessionKey() {
        return $this->container->get('settings')[ 'auth' ][ 'session' ];
    }

    /**
     * Sets the user authentication data
     *
     * @param mixed $id The user data
     */
    protected function setAppData($id) {
        if ($id) {
            $this->container->auth = $this->getAppDataCache((string) $id);
        } else {
            $this->container->auth = $id;
        }
    }

    /**
     * Gets the cached user data or returns fresh data if the cached object doesn't exist
     *
     * @param string $id The identifier of the user
     *
     * @return array The user object
     */
    protected function getAppDataCache(string $id) {
        $cache = $this->container->get('cache');

        $cacheKey = ":user-data|{$id}:";
        $cacheFor = 5;

        $cacheHit = $userData = $cache->get($cacheKey);

        if (!$cacheHit) {
            $userData = $this->app->user->fetch($id, TRUE);

            $cache->set($cacheKey, $userData, MEMCACHE_COMPRESSED, $cacheFor);
        }

        return $userData;
    }

}