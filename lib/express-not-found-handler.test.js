'use strict';

const expect = require('expect');

describe(__filename, () => {

  it('should return our 404 response', () => {
    const app = require('express')();
    const request = require('supertest')(app);

    app.use(require('./express-not-found-handler'));

    return request.get('/does-not-exist')
      .expect(404)
      .expect('content-type', 'application/json; charset=utf-8')
      .then((res) => {
        expect(res.body).toBeAn(Object);
        expect(res.body.message).toEqual('404 not found');
      });
  });

});
