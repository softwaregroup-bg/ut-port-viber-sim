const crypto = require('crypto');

module.exports = function viberSim(...params) {
    return class viberSim extends require('ut-port-webhook')(...params) {
        get defaults() {
            return {
                namespace: 'viberSim',
                path: '/pa/{method}',
                hook: 'botSim.viberFlow',
                mode: 'reply',
                async: false,
                server: {
                    port: 8181
                },
                request: {
                    json: false
                }
            };
        }

        handlers() {
            let lastReply;
            let id = 0;
            return {
                [`${this.config.hook}.identity.request.receive`]: () => {
                    return {
                        clientId: this.config.clientId,
                        appId: this.config.appId,
                        platform: 'viber',
                        accessToken: this.config.accessToken
                    };
                },
                [`${this.config.hook}.message.request.receive`]: msg => {
                    lastReply = {
                        platform: 'viber',
                        receiver: msg.receiver,
                        text: msg.text,
                        request: msg
                    };
                    return msg;
                },
                [`${this.config.namespace}.message.request.send`]: async(msg) => {
                    lastReply = undefined;
                    const timestamp = new Date().getTime();
                    let body = {
                        event: 'message',
                        timestamp,
                        chat_hostname: 'SN-CHAT-02_',
                        message_token: timestamp + '-' + id++,
                        sender: {
                            id: 'wF/bbCCrVtHurDUDq0ndDA==',
                            language: 'en',
                            country: 'BG',
                            api_version: 7
                        },
                        silent: false
                    };
                    switch (msg.type) {
                        case 'text':
                            body.message = {
                                text: msg.text,
                                type: 'text'
                            };
                            break;
                        case 'image':
                            body.message = {
                                type: 'picture',
                                media: msg.url,
                                thumbnail: msg.thumbnail,
                                file_name: 'image.jpg',
                                size: 10603
                            };
                            break;
                        case 'location':
                            body.message = {
                                type: 'location',
                                location: msg.location
                            };
                            break;
                    }
                    body = Buffer.from(JSON.stringify(body));
                    return {
                        url: 'http://localhost:8081/viber/' + (msg.appId || this.config.appId) + '/' + (msg.clientId || this.config.clientId),
                        body,
                        headers: {
                            'x-viber-content-signature': crypto
                                .createHmac('sha256', this.config.secret)
                                .update(body)
                                .digest()
                                .toString('hex')
                        }
                    };
                },
                [`${this.config.namespace}.message.response.receive`]: async(msg) => {
                    return {
                        httpResponse: msg,
                        reply: lastReply
                    };
                }
            };
        }
    };
};
