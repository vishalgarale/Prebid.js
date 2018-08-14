import * as utils from 'src/utils';
import {
  registerBidder
} from 'src/adapters/bidderFactory';
import bidfactory from 'src/bidfactory';

const BIDDER_CODE = 'datawrkz';
const USESSL = document.location.protocol == 'https:';
const ENDPOINT = (USESSL ? 'https:' : 'http:') + '//ssp.datawrkz.com/mediation';
const CURRENCY = 'USD';
const TTL = 360;
const NETREVENUE = true;

export const spec = {
  code: BIDDER_CODE,
  aliases: ['datawrkz'],
  get_script_tag: function(url) {
    return '<scr' + 'ipt src=' + url + '> </scr' + 'ipt>'
  },
  isBidRequestValid: function(bid) {
    return !!(bid && bid.params && bid.params.placement);
  },
  buildRequests: function(validBidRequests) {
    utils.logInfo('DW~ Calling datawrkz adaptor with parameters ', JSON.stringify(validBidRequests));
    var bidRequests = [];
    for (var i = 0; i < validBidRequests.length; i++) {
      var bid = validBidRequests[i];

      utils.logInfo('Bid is ', bid);

      let parameters = {
        'placement': bid['params']['placement'],
        'callback': bid['adUnitCode'],
        'ca_id': bid['auctionId'],
        'cbr_id': bid['bidderRequestId'],
        'page': utils.getTopWindowUrl(),
      };
      if (parameters.placement) {
        bidRequests.push({
          method: 'GET',
          url: ENDPOINT,
          bidRequest: bid,
          data: parameters
        });
        utils.logInfo('DW~ valid inputs, so requesting:bid', bidRequests);
      } else {
        utils.logInfo('DW~ Invalid inputs so canceling request:placement', parameters.placement);
      }
    }
    return bidRequests;
  },
  interpretResponse: function(serverResponse, request) {
    var bidRequest = request.bidRequest;
    var bidResponses = [];
    var bidResponse = serverResponse.body;

    try {
      utils.logInfo('DW~ Response come as ', JSON.stringify(bidResponse));
    } catch (_error) {
      utils.logInfo('Error due to ', _error)
      utils.logError(_error);
      return [];
    }

    var response = bidResponse['ads'][0];
    var bidObject;

    if (response.cpm > 0) {
      bidObject = bidfactory.createBid(1, bidRequest);
      var ad = response.adm;
      utils.logInfo('DW~ Original ad data', ad);
      //  ad += spec.addTrackingPixels(bidResponse.pixel);
      for (var j = 0; j < response.tracker.length; j++) {
        ad = ad + spec.get_script_tag(response.tracker[j]);
        utils.logInfo('DW~ Win pixel inserted ', response.tracker[j]);
      };
      bidResponses.push({
        requestId: bidRequest.bidId,
        cpm: response.cpm,
        width: response.width,
        height: response.height,
        creativeId: response.placement,
        currency: CURRENCY,
        netRevenue: NETREVENUE,
        ttl: TTL,
        referrer: utils.getTopWindowUrl(),
        ad: ad
      });
      utils.logInfo('DW~ bidResponse object:', bidResponses)
    } else {
      bidObject = bidfactory.createBid(2, bidRequest);
      utils.logError('DW~ bidResponse error:', bidObject.statusMessage);
    }
    return bidResponses;
  },
  getUserSyncs: function(syncOptions, serverResponses) {
    const syncs = []
    if (syncOptions.iframeEnabled) {
      syncs.push({
        type: 'iframe',
        url: '//acdn.adnxs.com/ib/static/usersync/v3/async_usersync.html'
      });
    }

    if (syncOptions.pixelEnabled && serverResponses.length > 0 && serverResponses[0].body.pixel.length > 0) {
      var sResponsePixels = serverResponses[0].body.pixel;
      for (var i = 0; i < sResponsePixels.length; i++) {
        if (sResponsePixels[i].indexOf('document.write') === -1) {
          syncs.push({
            type: 'image',
            url: sResponsePixels[i]
          });
        } else {
          syncs.push({
            type: 'iframe',
            url: sResponsePixels[i]
          });
        }
        utils.logInfo('DW~ Cookie pixel dropped', sResponsePixels[i]);
      }
    }
    return syncs;
  },
  onBidWon: function(bid, data) {
    // Bidder specific code
  }
}
registerBidder(spec);

/*
{
    "bidder":"datawrkz",
    "status":"ok",
    "callback":"div-gpt-ad-1460505748561-0",
    "pixel":[
        "http://x.bidswitch.net/sync?ssp=datawrkz",
        "http://ums.adtechus.com/mapuser?providerid=1034;getuser=http%3A%2F%2Fssp.datawrkz.com%2Fdtwz%2Fmatch%3Fdpoid%3D102%26dpuid%3D%24UID",
        "http://ib.adnxs.com/getuid?http://ssp.datawrkz.com/dtwz/match?dpoid=105&dpuid=$UID",
        "http://bh.contextweb.com/rtset?pid=561205&ev=1&rurl=http%3A%2F%2Fssp.datawrkz.com%2Fdtwz%2Fmatch%3Fdpoid%3D106%26dpuid%3D%25%25VGUID%25%25"
        ],
    "ads":[{
        "placement":324,
        "cpm":3.5520000000000005,
        "height":250,
        "width":300,
        "adm":"<script src=\"http://nym1-ib.adnxs.com/ab?e=wqT_3QKaB_BCmgMAAAMA1gAFAQion77VBRDL4v-_yszKv1UYqPyPqs6TxO08KjYJw_UoXI_CEUARw_UoXI_CEUAZAAAAwMzMEUAhww0SACkRJAAxERuoMMS24wI4vgdAvgdIAlCn84QdWJbpL2AAaJ2fSniX3QSAAQGKAQNVU0SSAQEG8FCYAawCoAH6AagBAbABALgBAsABA8gBAtABCdgBAOABAPABAIoCOnVmKCdhJywgNTkxNjgzLCAxNTIxNDU1MDE2KTt1ZigncicsIDYwODk3NzA6HgDwnJICgQIhbXpvWEd3aV9uNlVGRUtmemhCMFlBQ0NXNlM4d0FEZ0FRQVJJdmdkUXhMYmpBbGdBWVBfX19fOFBhQUJ3QVhnQmdBRUJpQUVCa0FFQm1BRUJvQUVCcUFFRHNBRUF1UUhBZXludWo4SVJRTUVCd0hzcDdvX0NFVURKQWVJdExPLW5lX0VfMlFFQUFBQUFBQUR3UC1BQkFQVUIFDyhKZ0NBS0FDQUxVQwUQBEwwCQjwVE1BQ0FjZ0NBZEFDQWRnQ0FlQUNBT2dDQVBnQ0FJQURBWkFEQUpnREFhZ0R2NS1sQmJvREVXUmxabUYxYkhRalRsbE5Nam8wTURRepoCOSE3QXUyLXc2BAHwimx1a3ZJQVFvQURvUlpHVm1ZWFZzZENOT1dVMHlPalF3TkRNLtgC6AfgAsfTAeoCTWh0dHA6Ly9hZHVuaXRzLnBvcG11bmNoLmNvbS9uZWVtYS9wcmViaWQvMS4zL21haW5fcHJlYmlkLmh0bWw_cGJqc19kZWJ1Zz10cnVl8gIQCgZBRFZfSUQSBjUl2RzyAhEKBkNQRwETOAcyNDYyOTE48gIRCgVDUAET8JkIMTEwOTU5OTmAAwGIAwGQAwCYAxSgAwGqAwDAA6wCyAMA2AMA4AMA6AMA-AMDgAQAkgQJL29wZW5ydGIymAQAogQNMTA2LjUxLjIyNy44NagEALIEDAgAEAAYACAAMAA4ALgEAMAEAMgEANIEEWRlZmF1bHQjTllNMjo0MDQz2gQCCAHgBADwBKfzhB2IBQGYBQCgBf______AQNoAaoFEUQyNkQ4ODIxOTYxODYwMzExwAUAyQUABQEU8D_SBQkJBQtkAAAA2AUB4AUB8AXeAvoFBAgAEACQBgCYBgA.&s=5a3929b7dda1c0e35e9863ff3018dfdb21c3c152&referrer=http%3A%2F%2Fadunits.popmunch.com%2Fneema%2Fprebid%2F1.3%2Fmain_prebid.html%3Fpbjs_debug%3Dtrue&pp=3.5520000000000005\"></script>",
        "tracker":["http://ssp.datawrkz.com/dtwz/fimp?data=YXVjPUQyNkQ4ODIxOTYxODYwMzExJmR0PTE1MjE0NTUwMTQ1NjcmcGxjPTMyNCZwdWI9MTM2JmNuPUlORCZyZz1LQSZjdD1CZW5nYWx1cnUmenA9bnVsbCZpcD0xMDYuNTEuMjI3Ljg1JnVpZD05NWQ0Y2M1Y2IzMGQ0NTc5YjUxYWNiODQ5YmQ3ZTNjNiZhYmlkPTQuNDQmYmlkPTMuNTUyMDAwMDAwMDAwMDAwNSZ3aW49My41NTIwMDAwMDAwMDAwMDA1JmRwPTEwNSZkY209OTU4JmRjcj02MDg5NzcwMyZkc2U9OTU4JmRhZD02MDg5NzcwMw==&price="]
    }]
}
*/
