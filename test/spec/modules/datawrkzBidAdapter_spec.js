import { expect } from 'chai';
import { spec } from 'modules/datawrkzBidAdapter';

describe('datawrkzBidAdapterTests', () => {
  let bidRequest = [{
      bidId: '234dfgdfg',
      bidder: 'datawrkz',
      bidderRequestId: '35dfgdfgs',
      params: {
        placement: "11"
      },
      placementCode: 'test-div-1',
      auctionId: 'adfadf-345dfgafad-323-adfadfadfaf',
      sizes: [[300, 250]],
      transactionId: 'edfadf6da-87a6-4029-aeb0-1b2dfabbfb5'
  }];

  it('validate_required_parameters', () => {
    expect(spec.isBidRequestValid(bidRequest[0])).to.equal(true);
  });

  it('validate_request_parameters', () => {
    let request = spec.buildRequests(bidRequest);
    expect(request[0].url).to.equal('http://ssp.datawrkz.com/mediation');
    expect(request[0].method).to.equal('GET');
    expect(request[0].data.placement).to.equal('11');
  });

  it('validate_response_params', () => {
    let serverResponse = {}

    serverResponse.body = {
      "bidder": "datawrkz",
      "status": "ok",
      "callback": "test-div-1",
      "pixel": [],
      "ads": [{
          "placement": 11,
          "cpm": 0.8,
          "height": 250,
          "width": 300,
          "adm": "<h1>Hello Datawrkz</h1>",
          "tracker": []
        }
      ]
    }

    let bids = spec.interpretResponse(serverResponse, { "bidRequest": bidRequest[0] } );
    expect(bids[0]).to.have.all.keys('requestId', 'cpm', 'width', 'height', 'creativeId', 'currency', 'netRevenue', 'ttl', 'referrer', 'ad');

    expect(bids).to.have.lengthOf(1);
    expect(bids[0].requestId).to.equal('234dfgdfg');
    expect(bids[0].cpm).to.equal(0.8);
    expect(bids[0].width).to.equal(300);
    expect(bids[0].height).to.equal(250);
    expect(bids[0].currency).to.equal('USD');
  });

  it('validate_response_params', () => {

    let syncOptions = { iframeEnabled: true, pixelEnabled: true }
    let serverResponses = [{
      body:{
        pixel: ["http://ums.adtechus.com/mapuser?providerid=1034;getuser=http%3A%2F%2Fssp.datawrkz.com%2Fdtwz%2Fmatch%3Fdpoid%3D102%26dpuid%3D%24UID"]
      }
    }]

    let userSync = spec.getUserSyncs(syncOptions, serverResponses);

    expect(userSync).to.be.an('array').with.lengthOf(2);
    expect(userSync[0].type).to.exist;
    expect(userSync[0].url).to.exist;
    expect(userSync[0].type).to.be.equal('iframe');
    expect(userSync[0].url).to.be.equal('//acdn.adnxs.com/ib/static/usersync/v3/async_usersync.html');
    expect(userSync[1].type).to.exist;
    expect(userSync[1].url).to.exist;
    expect(userSync[1].type).to.be.equal('image');
    expect(userSync[1].url).to.be.equal('http://ums.adtechus.com/mapuser?providerid=1034;getuser=http%3A%2F%2Fssp.datawrkz.com%2Fdtwz%2Fmatch%3Fdpoid%3D102%26dpuid%3D%24UID');
  });
});
