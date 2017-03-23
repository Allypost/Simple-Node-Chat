<?php

namespace App\DB;

use Illuminate\Database\Eloquent\Model;

class ChatMessage extends Model {

    protected $table = 'chat_messages';

    protected $fillable = [
        'user',
        'message',
        'created_at',
        'updated_at',
    ];

    public function user() {
        return $this->belongsTo('\App\DB\User', 'user');
    }
}