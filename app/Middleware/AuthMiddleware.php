<?php

namespace App\Middleware;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Slim\Container;

class AuthMiddleware {
    private $container;
    private $request;
    private $response;

    public function __construct(Container $container) {
        $this->container = $container;
    }

    public function __invoke(ServerRequestInterface $request, ResponseInterface $response, callable $next): ResponseInterface {
        $this->request  = $request;
        $this->response = $response;

        $response = $next($request, $response);

        return $response;
    }

    /**
     * Get user ID from session
     */
    protected function getIdentifier() {
        $sessionKey = $this->getSessionKey();

        $identifier = @$_SESSION[ $sessionKey ];

        if (!$identifier)
            $identifier = FALSE;

        return $identifier;
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
     * @param mixed $identifier The user data
     */
    protected function setAppData($identifier) {
        if ($identifier)
            $this->container->auth = $this->getAppDataCache((string) $identifier);
        else
            $this->container->auth = $identifier;
    }

    /**
     * Gets the cached user data or returns fresh data if the cached object doesn't exist
     *
     * @param string $identifier The identifier of the user
     *
     * @return array The user object
     */
    protected function getAppDataCache(string $identifier) {
        $cache  = $this->container->get('cache');
        $prefix = $this->container->get('settings')[ 'auth' ][ 'domain' ];

        $cacheKey = "$prefix:user-data|{$identifier}:";
        $cacheFor = 5;

        $cacheHit = $userData = $cache->get($cacheKey);

        if (!$cacheHit) {
            $userData = $this->container->get('user')->fetch($identifier);

            $cache->set($cacheKey, $userData, MEMCACHE_COMPRESSED, $cacheFor);
        }

        return $userData;
    }

    /**
     * Check and validate authentication cookie
     */
    protected function checkRememberMe() {
        $rememberName = $this->container->get('settings')[ 'auth' ][ 'remember' ];
        $cookies      = $this->request->getCookieParams();

        if (
            isset($cookies[ $rememberName ])
            && !$this->container->get('auth')
        ) {

            $data        = $cookies[ $rememberName ];
            $credentials = explode('..', $data);

            if (empty(trim($data)) || count($credentials) !== 2)
                setcookie($rememberName, '', -1, '/');
            else
                $this->container->get('user')->refresh($credentials);
        }
    }

}