<?php

namespace App\Helpers;

class HashHelper {

    const KEYWORDS = [
        'encrypt' => [
            'encrypt',
            'enc',
        ],
        'decrypt' => [
            'decrypt',
            'dec',
        ],
    ];

    const DELIMITER = '$';

    protected $config;

    /**
     * HashHelper constructor.
     *
     * @param array $config The configuration from the settings
     */
    public function __construct(array $config) {
        $this->config = $config;
    }

    /**
     * Custom PHP password_hash function
     *
     * @param string $password The password you want to encrypt
     *
     * @return string The password hash
     */
    public function password(string $password): string {
        $algorithm = $this->getAlgorithm();
        $cost      = $this->getCost();

        $settings = [
            'cost' => $cost,
        ];

        $generatedPassword = password_hash($password, $algorithm, $settings);

        $returnPassword = $this->encrypt($generatedPassword);

        return $returnPassword;
    }

    /**
     * Returns the encryption algorithm from the config
     */
    protected function getAlgorithm(): int {
        return (int) $this->config[ 'algorithm' ];
    }

    /**
     * Returns the default encryption cost from the config or $cost if set
     *
     * @param int $cost The cost for the encryption
     *
     * @return int The cost for the encrypt function
     */
    protected function getCost(int $cost = NULL): int {
        if (empty($cost) || !is_int($cost))
            $cost = $this->config[ 'cost' ];

        return (int) ( $cost > 0 ) ? $cost : 5;
    }

    /**
     * Encrypt a string
     *
     * @param string $string   The string to be encrypted
     * @param string $password The password with wich you want to add a layer of encryption
     *
     * @return string The hash
     */
    public function encrypt(string $string, string $password = ''): string {
        return (string) $this->encrypt_decrypt($string, 'enc', $password);
    }

    /**
     * Alias for passwordCheck
     *
     * @param string $password     The user supplied password
     * @param string $passwordHash The hash generated with the password function
     *
     * @return bool Returns whether the passwords match
     */
    public function checkPassword(string $password, string $passwordHash) {
        return $this->passwordCheck($password, $passwordHash);
    }

    /**
     * Custom wrapper for PHP password_verify
     *
     * @param string $password     The user supplied password
     * @param string $passwordHash The hash generated with the password function
     *
     * @return bool Returns whether the passwords match
     */
    public function passwordCheck(string $password, string $passwordHash): bool {
        return password_verify($password, $this->decrypt($passwordHash));
    }

    /**
     * Decrypt a string
     *
     * @param string $hash     The string to be encrypted
     * @param string $password The password with wich you want to add a layer of encryption
     *
     * @return string The hash
     */
    public function decrypt(string $hash, string $password = '') {
        return $this->encrypt_decrypt($hash, 'dec', $password);
    }

    /**
     * Encrypts or decrypts the supplied string depending on the $action parameter
     *
     * @param string $string             The string to be encrypted
     * @param string $action             Whether to encrypt or decrypt the string
     * @param string $encryptionPassword The 'password' for the encryption
     *
     * @return string The hash encrypted with the $secret_key as 'password'
     */
    protected function encrypt_decrypt(string $string = "", string $action = 'enc', string $encryptionPassword = ''): string {
        $string = $this->fixValue($string);

        $encrypt_method = 'AES-256-CTR';

        // Add default "password" to file
        $secret_key = $this->getSecretKey((string) $encryptionPassword);

        $password = $this->hash($secret_key);

        $output = $this->doEncryptDecrypt($action, $string, $encrypt_method, $password);

        return (string) $output;
    }

    /**
     * Basic value serialization
     *
     * @param $value  mixed The value to be serialized
     *
     * @return string The serialized string (returns original value if string)
     */
    protected function fixValue($value): string {
        if (is_scalar($value))
            return (string) $value;

        if (is_array($value) || is_object($value))
            return json_encode($value);

        if (is_resource($value))
            return '';

        return serialize($value);
    }

    /**
     * Returns the default secret key from the config if $secretKey isn't set
     *
     * @param string $secretKey The default secret key value
     *
     * @return string The secret key
     */
    protected function getSecretKey(string $secretKey = ''): string {
        if (empty($secretKey))
            $secretKey = $this->config[ 'secret_key' ];

        return (string) $secretKey;
    }

    /**
     * 'Routes' the value to encryption/decryption
     *
     * @param string $action      Whether to encrypt or decrypt the string
     * @param string $value       The string to be encrypted/decrypted
     * @param string $cryptMethod The algorithm for the encryption/decryption
     * @param string $password    The 'password' for the encryption/decryption
     *
     * @return string Either the hash or the decrypted string
     */
    private function doEncryptDecrypt($action, $value, $cryptMethod, $password): string {
        $kw              = self::KEYWORDS;
        $decryptKeywords = $kw[ 'decrypt' ];

        if (in_array($action, $decryptKeywords))
            return $this->doDecrypt($value, $cryptMethod, $password);

        return $this->doEncrypt($value, $cryptMethod, $password);
    }

    /**
     * Generate a new cryptographically secure IV for
     *
     * @return string
     */
    protected function generateIV(): string {
        return (string) random_bytes(16);
    }

    protected function getIV($value): string {
        $iv = explode(self::DELIMITER, $value)[ 0 ];

        return (string) base64_decode($iv);
    }

    /**
     * Performs the decryption (wrapper for PHP openssl_decrypt)
     *
     * @param string $value       The value to be decrypted
     * @param string $cryptMethod The algorithm for the decryption
     * @param string $password    The 'password' for the decryption
     *
     * @return string The hash encrypted with the $password
     */
    private function doDecrypt(string $value, string $cryptMethod, string $password): string {
        $iv  = $this->getIV($value);
        $str = explode(self::DELIMITER, $value)[ 1 ];

        return (string) openssl_decrypt($str, $cryptMethod, $password, FALSE, $iv);
    }

    /**
     * Performs the encryption (wrapper for PHP openssl_encrypt)
     *
     * @param string $value       The value to be encrypted
     * @param string $cryptMethod The algorithm for the encryption
     * @param string $password    The 'password' for the encryption
     *
     * @return string The hash encrypted with the $password
     */
    private function doEncrypt(string $value, string $cryptMethod, string $password): string {
        $iv  = $this->generateIV();
        $enc = openssl_encrypt($value, $cryptMethod, $password, FALSE, $iv);
        $d   = self::DELIMITER;

        $ivStr = rtrim(base64_encode($iv), '=');

        return "{$ivStr}{$d}{$enc}";
    }

    /**
     * Custom wrapper for PHP hash
     *
     * @param $input string Value to be hashed
     *
     * @return string Returns the hash
     */
    public function hash($input): string {
        return hash('sha256', $input, FALSE);
    }

    /**
     * Custom wrapper for PHP hash_equals
     *
     * @param string $known The known hash
     * @param string $user  The use supplied hash
     *
     * @return bool Whether the hashes match
     */
    public function hashCheck(string $known, string $user): bool {
        return hash_equals($known, $user);
    }

    /**
     * Generate random alphanumerical string
     *
     * @param int    $length  The length of the string
     * @param string $charset The charset from which the string will be made out of
     *
     * @return string Random string of length $length
     */
    public function random(int $length, string $charset = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'): string {
        $max    = mb_strlen($charset, '8bit') - 1;
        $return = '';

        for ($i = 0; $i < $length; ++$i)
            $return .= $charset[ random_int(0, $max) ];

        return $return;
    }

}
