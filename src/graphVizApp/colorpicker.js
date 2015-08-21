'use strict';

var $               = window.$;
var _               = require('underscore');
var Rx              = require('rx');
                      require('../rx-jquery-stub');
var util            = require('./util.js');
var Color           = require('color');


//$DOM * hex -> Observable hex
function makeInspector ($elt, hexColor) {

    var colors = new Rx.Subject();

    $elt.find('.colorSelector').ColorPicker({
        color: hexColor,
        onShow: function (colpkr) {
            $(colpkr).fadeIn(500);
            return false;
        },
        onHide: function (colpkr) {
            $(colpkr).fadeOut(500);
            return false;
        },
        onChange: function (hsb, hex, rgb) {
            $elt.find('.colorSelector div').css('backgroundColor', '#' + hex);
            colors.onNext(rgb);
        }
    });

    return colors;
}


function renderConfigValueForColor(colorValue) {
    return _.map(colorValue.rgbaArray(), function (value, index) {
        // Unspecified alpha => opaque
        if (index === 3 && value === undefined) {
            return 1;
        }
        return value / 255;
    });
}


function colorFromRenderConfigValue(rgbaFractions) {
    var rgbaBytes = _.map(rgbaFractions, function (value) {
        return value * 255;
    }),
        result = new Color();
    result.rgb(rgbaBytes.slice(0, 3)).alpha(rgbaBytes[3]);
    return result;
}


/**
 *
i * @param {HTMLElement} $fg - Element for the foreground color button affordance.
 * @param {HTMLElement} $bg - Element for the background color button affordance.
 * @param {Socket} socket - socket or proxy
 * @param {RenderState} renderState
 * @returns {{foregroundColor: *, backgroundColor: *}} - streams of Color objects
 */
module.exports = {
    init: function ($fg, $bg, socket, renderState) {

        var foregroundColorObservable = new Rx.ReplaySubject(1),
            blackForegroundDefault = (new Color()).rgb(0, 0, 0);
        foregroundColorObservable.onNext(blackForegroundDefault);
        makeInspector($fg, blackForegroundDefault.hexString())
            .throttleFirst(10)
            .do(function (foregroundColor) {
                socket.emit('set_colors', {rgb: foregroundColor});
            })
            .subscribe(foregroundColorObservable, util.makeErrorHandler('bad foreground color'));

        var backgroundColorObservable = new Rx.ReplaySubject(1);

        var renderStateBackgroundColor = colorFromRenderConfigValue(renderState.get('options').clearColor[0]);

        backgroundColorObservable.onNext(renderStateBackgroundColor);
        makeInspector($bg, renderStateBackgroundColor.hexString())
            .throttleFirst(10)
            .do(function (backgroundColor) {
                // Set the background color directly/locally via CSS:
                $('#simulation').css('backgroundColor', backgroundColor.rgbaString());
                // Update the server render config:
                socket.emit('update_render_config', {'options': {'clearColor': [renderConfigValueForColor(backgroundColor)]}});
            })
            .subscribe(backgroundColorObservable, util.makeErrorHandler('bad background color'));

        return {
            foregroundColor: foregroundColorObservable,
            backgroundColor: backgroundColorObservable
        };
    },

    makeInspector: makeInspector,

    renderConfigValueForColor: renderConfigValueForColor
};
