<?php
use App\Action\HomeAction as Home;
use App\Middleware\{
    UserLoggedInMiddleware, UserNotLoggedInMiddleware
};
use Slim\Http\{
    Request, Response
};

// Routes
$app->get('/', Home::class . ':home')->setName('home');
$app->post('/login', Home::class . ':auth')->add(UserNotLoggedInMiddleware::class)->setName('api:login');
$app->get('/logout', Home::class . ':logout')->add(UserLoggedInMiddleware::class)->setName('api:logout');

$app->group('/chat', function () {

    $this->get('/online', function (Request $request, Response $response) {
        $o      = $this->get('o')->addResponse($response);
        $online = array_values(json_decode(file_get_contents('http://localhost:3000/online'), TRUE));

        return $o->say('chat users', $online);
    })->setName('api:chat:online');

    $this->get('/online/count', function (Request $request, Response $response) {
        $o      = $this->get('o')->addResponse($response);
        $online = json_decode(file_get_contents('http://localhost:3000/online/count'), TRUE);

        return $o->say('chat users count', $online);
    })->setName('api:chat:online:count');

})->add(UserLoggedInMiddleware::class);