<?php

namespace App\DB;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

class User extends Model {

    protected $table = 'users';

    protected $hash;
    protected $config;

    protected $fillable = [
        'uuid',
        'name',
        'password',
        'email',
        'remember_identifier',
        'remember_token',
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'id' => 'integer',
    ];

    protected $dates = [
        'created_at',
        'updated_at',
        'deleted_at',
    ];

    protected $hidden = [
        'password',
        'remember_identifier',
        'remember_token',
        'created_at',
        'updated_at',
        'deleted_at',
    ];

    /**
     * Set hashing library
     *
     * @param mixed $hash The hashing library
     *
     * @return $this Return self for easier method chaining
     */
    public function addHash($hash) {
        $this->hash = $hash;

        return $this;
    }

    /**
     * Set the config for authentication
     *
     * @param array $config The config array
     *
     * @return $this Return self for easier method chaining
     */
    public function addConfig(array $config) {
        $this->config = $config;

        return $this;
    }

    /**
     * Fetch a user from the database by identifier (username or email).
     * Return instance of User if user was found, otherwise return null.
     *
     * @param string $identifier
     *
     * @return self|null Populated instance of self if found, otherwise null
     */
    public function fetch(string $identifier) {
        return $this->where('email', $identifier)
                    ->orWhere('username', $identifier)
                    ->first();
    }

    /**
     * Fetch a user from the database by identifier (username or email).
     * Return instance of User if user was found, otherwise return null.
     *
     * @param string $by         The field to which to search by
     * @param string $identifier The user identifier (username or password)
     *
     * @return self|null Populated instance of self if found, otherwise null
     */
    public function fetchBy(string $by, string $identifier) {
        return $this->where($by, $identifier)
                    ->first();
    }

    /**
     * Update the remember (auth) credentials for the current User
     *
     * @param string $rememberIdentifier The identifier
     * @param string $rememberToken      The token
     *
     * @return bool Whether the update was successful
     */
    public function updateRememberCredentials($rememberIdentifier, $rememberToken) {
        return $this->update(
            [
                'remember_identifier' => $rememberIdentifier,
                'remember_token'      => $rememberToken,
            ]
        );
    }

    /**
     * Log the current user in (step 1 of 3)
     *  - Basic data sanitisation
     *  - Check login attempts
     *
     * @param string $identifier The user identifier (username or password)
     * @param string $password   The user supplied password
     * @param bool   $remember   Whether to add a remember cookie
     *
     * @return array Standard response
     */
    public function login(string $identifier, string $password, bool $remember = FALSE): array {
        list($identifier, $password) = $this->loginSanitizeData($identifier, $password);

        $validation = $this->loginValidateCredentials($identifier, $password);

        if ($validation[ 'status' ] === 'error')
            return $validation;

        return $this->loginPropagate($identifier, $password, $remember);
    }

    /**
     * Log the user in (step 2 of 3)
     *  - Check data against DB
     *
     * @param string $identifier The user identifier (username or password)
     * @param string $password   The user supplied password
     * @param bool   $remember   Whether to add a remember cookie
     *
     * @return array Standard response
     */
    protected function loginPropagate(string $identifier, string $password, bool $remember) {
        $h = $this->hash;

        $user = $this->fetch($identifier);

        if (!$user)
            return self::err("Invalid identifier or password");

        $passwordsMatch = $h->checkPassword($password, $user->password);

        if (!$passwordsMatch)
            return self::err("Invalid identifier or password");

        return $this->loginFinalise($user, $remember);
    }

    /**
     * Log the user in (step 3 of 3)
     *  - Push data to session
     *  - Add remember cookie [if $remember is true]
     *
     * @param self $user     The User object
     * @param bool $remember Whether to add a remember cookie
     *
     * @return array Standard response
     */
    protected function loginFinalise(self $user, bool $remember) {
        $sessionName = $this->config[ 'session' ];

        $u = @$_SESSION[ $sessionName ] = $user->id;

        if (!is_int($u) || !isset($_SESSION[ $sessionName ]) || !is_int($_SESSION[ $sessionName ]))
            return self::err('Couldn\t edit session');

        if ($remember)
            $remembered = $this->loginRemember($user);
        else
            $remembered = TRUE;

        if (!$remembered)
            return self::err('Couldn\'t set remember me cookie');

        return self::say($user->toArray());
    }

    /**
     * Add the remember cookie
     *
     * @param self $user The User object
     *
     * @return bool Whether the remember was successful
     */
    protected function loginRemember(self $user): bool {
        $hash = $this->hash;

        $rememberIdentifier = $hash->random(128);
        $rememberToken      = $hash->random(128);
        $domain             = $this->config[ 'domain' ];

        $name     = $this->config[ 'remember' ];
        $value    = "{$rememberIdentifier}..{$rememberToken}";
        $expires  = Carbon::parse($this->config[ 'remember_for' ])->timestamp;
        $path     = '/';
        $secure   = TRUE;
        $httpOnly = TRUE;

        $u = $user->updateRememberCredentials(
            $rememberIdentifier,
            $hash->hash($rememberToken)
        );

        $c = setcookie($name, $value, $expires, $path, $domain, $secure, $httpOnly);

        return (bool) $u && $c;
    }

    /**
     * Perform basic data sanitisation
     *
     * @param string $identifier The user identifier (username or password)
     * @param string $password   The user supplied password
     *
     * @return array Sanitised data in form [identifier, password]
     */
    private function loginSanitizeData(string $identifier, string $password) {
        return [ strtolower(trim($identifier)), $password ];
    }

    /**
     * Perform basic local checks on credentials
     *
     * @param string $identifier The user identifier (username or password)
     * @param string $password   The user supplied password
     *
     * @return array Standard response
     */
    private function loginValidateCredentials(string $identifier, string $password): array {
        if (empty($username) || empty($password))
            return self::err('Username and password must be filled in');

        return self::say(compact('identifier', 'password'));
    }

    /**
     * Return standardized error message
     *
     * @param string $msg The message
     *
     * @return array Array of form [ 'status' => 'error', 'error' => $msg ]
     */
    protected static function err(string $msg) {
        return self::msg($msg, TRUE);
    }

    /**
     * Return standardized success message
     *
     * @param mixed $data The data to be passed along
     *
     * @return array Array of form [ 'status' => 'ok', 'data' => $data ]
     */
    protected static function say($data) {
        return self::msg($data, FALSE);
    }

    /**
     * Return standardized response message
     *
     * @param mixed $data  The data
     * @param bool  $error Whether the message is an error
     *
     * @return array
     */
    protected static function msg($data, bool $error): array {
        if ($error)
            return [
                'status' => 'error',
                'error'  => $data,
            ];

        return [
            'status' => 'ok',
            'data'   => $data,
        ];
    }
}