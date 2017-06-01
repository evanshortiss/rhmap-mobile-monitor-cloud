'use strict';

const expect = require('expect');

describe(__filename, () => {

  it('should return our 404 response', () => {
    const app = require('express')();
    const request = require('supertest')(app);

    app.get('/broken-endpoint', () => {
      throw new Error('uh oh!');
    });

    app.use(require('./express-error-handler'));

    return request.get('/broken-endpoint')
      .expect(500)
      .expect('content-type', 'application/json; charset=utf-8')
      .then((res) => {
        expect(res.body).toBeAn(Object);
        expect(res.body.message).toEqual('an internal server error occurred');
      });
  });

});
