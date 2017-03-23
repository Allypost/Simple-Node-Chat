<?php
use App\Action\HomeAction as Home;
use Slim\Http\Request;
use Slim\Http\Response;

// Routes
$app->get('/', Home::class . ':home')->setName('home');
$app->post('/login', Home::class . ':auth')->setName('api:login');
$app->get('/logout', Home::class . ':logout')->setName('api:logout');

$app->get('/online', function (Request $request, Response $response) {
    $o      = $this->get('o')->addResponse($response);
    $online = array_values(json_decode(file_get_contents('http://localhost:3000/online'), TRUE));

    return $o->say('chat users', $online);
});