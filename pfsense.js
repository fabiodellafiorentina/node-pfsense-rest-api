'use strict';

const EventEmitter = require('eventemitter2').EventEmitter2;
const axios = require('axios');
const https = require('https');

class API extends EventEmitter {
    constructor(options) {
        super({ wildcard: true });

        this.opts = options || {};
        this.opts.host = (typeof this.opts.host !== 'undefined') ? this.opts.host : 'pfsense.home';
        this.opts.port = (typeof this.opts.port !== 'undefined') ? this.opts.port : 443;
        this.opts.sslverify = (typeof this.opts.sslverify !== 'undefined') ? this.opts.sslverify : true;
        let auth = ['local','token','jwt'];
        switch(this.opts.auth) {
            case 'jwt':
                // TO DO
                break;
            case 'token':
                this.opts.clientId = (typeof this.opts.clientId !== 'undefined') ? this.opts.clientId : null;
                this.opts.clientToken = (typeof this.opts.clientToken !== 'undefined') ? this.opts.clientToken : null;
                this.opts.timeout = (typeof this.opts.timeout !== 'undefined') ? this.opts.timeout : 5000;
                break;
            case 'local':
            default:
                this.opts.auth = 'local';
                this.opts.username = (typeof this.opts.username !== 'undefined') ? this.opts.username : 'admin';
                this.opts.password = (typeof this.opts.password !== 'undefined') ? this.opts.password : 'pfsense';
        }
    }

    async _request(path, payload = null, method = null, raw = false) {
        if (typeof (this._instance) === 'undefined') {
            await this._init();
        }

        if (payload !== null) {
            method = method === 'PUT' ? 'PUT' : 'POST';
        } else if (method === null) {
            method = 'GET';
        }

        const response = await this._instance.request({
            url: this._url(path),
            method,
            data: payload,
            timeout: this.opts.timeout
        });

        const body = response.data;
        if (body !== null && typeof (body) !== 'undefined') {
            if (typeof (body.meta) !== 'undefined') {
                if (response.status >= 200 && response.status < 400 && body.meta.rc === 'ok') {
                    if (raw === true) { return body; }
                    return body.data;
                }
                const error = typeof (body.meta.msg) === 'undefined' ? new Error('generic error') : new Error(body.meta.msg);
                throw error;
            } else if (response.status >= 200 && response.status < 400) {
                return body;
            } else {
                throw new Error('invalid status return');
            }
        } else {
            throw new Error('empty response data');
        }
    }

    async _init() {
        if (this._isInit === true) {
            return 2;
        }

        this._baseurl = new URL(`https://${this.opts.host}:${this.opts.port}`);

        switch(this.opts.auth) {
            case 'jwt':
                // TO DO
                break;
            case 'token': 
                this._instance = axios.create({
                    baseURL: this._baseurl.toString(),
                    responseType: 'json',
                    headers: { 'Authorization': this.opts.clientId + ' ' + this.opts.clientToken },
                    responseEncoding: 'utf8',
                    httpsAgent: new https.Agent({ rejectUnauthorized: false })
                });
                break;
            case 'local':
                // TO DO
        }

        this._isInit = true;
        return 1;
    }

    _url(path) {
        return `${this._baseurl.href}api/v1/${path}`;
    }
}

module.exports = { API };