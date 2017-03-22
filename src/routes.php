<?php
use App\Action\HomeAction as Home;

// Routes
$app->get('/', Home::class . ':home');
$app->post('/', Home::class . ':auth');
