const fs = require('fs');

/**
    * Creates an entry. element
    *
    * @param      {<type>}            path    The path
    * @return     {(Object|boolean)}  { description_of_the_return_value }
    */
const createEntry = path => fs.existsSync(path) && {
    content: fs.readFileSync(path).toString(),
    time: fs.statSync(path).mtime.getTime(),
    cachevalid: true
};

/**
 * Gets the file extension.
 *
 * @param      {<type>}  fname   The filename
 * @return     {<type>}  The file extension.
 */
const getFileExtension = fname => (fname.split('.').pop());

/**
 * Gets the file time.
 *
 * @param      {<type>}  path    The path
 * @return     {<type>}  The file time.
 */
const getFileTime = thepath => fs.existsSync(thepath)
    && fs.statSync(thepath).mtime.getTime();

/**
 * get a unique array given an array
 *
 * @param      {<type>}  a       { parameter_description }
 * @return     {Array}   { description_of_the_return_value }
 */
// uniquearr: a => a.filter((el, i) => a.indexOf(el) == i),
const uniquearr = a => {
    const h = {};
    return a.filter(el => h[el] ? false : (h[el] = true))
};

/**
 * checks if a ns exists
 *
 * @param      {<type>}           ns      { parameter_description }
 * @param      {(number|string)}  ctx     The context
 */
const checkns = (ns, ctx) => {
    "use strict";
    const els = ns.split(/\.|\//),
        l = els.length;

    let i = 0;
    ctx = (ctx !== undefined) ? ctx : {};

    if (!ns) return ctx;
    for (null; i < l; i += 1) {
        if (typeof ctx[els[i]] !== 'undefined') {
            ctx = ctx[els[i]];
        } else {
            // break it
            return undefined;
        }
    }
    return ctx;
};

/**
 * json from a string
 *
 * @param      {string}   s       { parameter_description }
 * @return     {boolean}  { description_of_the_return_value }
 */
const jsonFromStr = s => {
    let r = {};
    if (s === undefined) {
        return false;
    }
    try {
        eval('r = {' + s + '}');
    } catch (e) {
        return r;
    }
    return r;
};

/**
 * [isArray description]
 * @param  {[type]}  o [description]
 * @return {Boolean}   [description]
 */
const isArray = o => {
    if (Array.isArray && Array.isArray(o)) {
        return true;
    }
    const t1 = String(o) !== o,
        t2 = {}.toString.call(o).match(/\[object\sArray\]/);
    return t1 && !!(t2 && t2.length);
};

/**
 * [isString description]
 * @param  {[type]}  o [description]
 * @return {Boolean}   [description]
 */
const isString = o => typeof o === 'string' || o instanceof String;

/**
 * [getIterator description]
 * @param  {Array} els [description]
 * @return {Iterator}     [description]
 */
const getIterator = els => {
    let i = 0;
    return {
        reset: () => {i = 0;},
        hasNext: () => i < els.length,
        next: () => els[i++],
        size: () => els.length
    }
};

/**
 * [replaceAll description]
 * @param  {[type]} tpl     [description]
 * @param  {[type]} obj     [description]
 * @param  {[type]} options [description]
 * @return {[type]}         [description]
 */
const replaceAll = (tpl, obj, options) => {
    "use strict";
    const self = this;

    let start = '%',
        end = '%',
        fb = null,
        clean = false,
        reg,
        straight = true,
        // str,
        tmp, last;

    if ('undefined' !== typeof options) {
        if ('delim' in options) {
            start = options.delim[0];
            end = options.delim[1];
        }
        if ('fb' in options) {
            fb = options.fb;
        }
        clean = !!options.clean;
    }

    reg = new RegExp('\\' + start + '(\\\+)?([A-z0-9-_\.]*)' + '\\' + end, 'g');

    while (straight) {
        if (!(tpl.match(reg))) {
            return tpl;
        }
        tpl = tpl.replace(reg, (str, enc, $1, _t) => {

            if (typeof obj === 'function') {
                /**
                 * avoid silly infiloops */
                tmp = obj($1);
                _t = (tmp !== start + $1 + end) ? obj($1) : $1;

            } else if ($1 in obj) {

                _t = typeof obj[$1];
                if (_t === 'function') {
                    _t = obj[$1]($1);
                } else if (_t === 'object') {
                    _t = '';
                } else {
                    _t = obj[$1];
                }
                // incomplete when the placeholder points to a object (would print)
                // _t = typeof obj[$1] === 'function' ? obj[$1]($1) : obj[$1];

                /**
                    * not a function and not found in literal
                    * use fallback if passed or get back the placeholder
                    * switching off before returning
                    */
            } else {
                /* @ least check for ns, in case of dots
                */
                if ($1.match(/\./)) {
                    last = checkns($1, obj);
                    if (last) {
                        _t = enc ? encodeURIComponent(last) : last;
                        return typeof last === 'function' ? last($1) : last;
                    }
                }
                // but do not go deeper   
                straight = false;
                _t = fb !== null ? fb($1) : clean ? '' : start + $1 + end;
            }
            return enc ? encodeURIComponent(_t) : _t;
        });
    }
    return tpl;
};

const validateJson = json => {
    try {
        JSON.parse(json);
    } catch (e) {
        return false;
    }
    return true;
};

const solveJson = (obj, lim) => {
    let maxSub = lim || 1E3;
    return (function _(o) {
        let y, j;
        for (j in o) {
            switch (typeof o[j]) {
                case 'string':
                    while (y = o[j].match(/\$([A-z0-9-_/.]+)\$/)) {
                        o[j] = o[j].replace(
                            '$' + y[1] + '$',
                            checkns(y[1], obj) || ""
                        );
                        if (maxSub-- < 0) {
                            // console.log('[ERROR] it seems like variable json has looping placeholders!');
                            const e = new Error('[ERROR] it seems like variable json has looping placeholders!');
                            e.stop = true;
                            throw e;
                        }
                    }
                    break;
                case 'object':
                    o[j] = _(o[j]);
                    break;
            }
        }
        return o;
    })(obj);
};

const replaceLinenumbers = tpl => (
    tpl.split(/\n/)
    .map(
        (line, i) => line.replace(/__LINE__/g, i + 1)
    ).join("\n")
);

const objMultiKey = o => {
    let ret = {}, i, j, jl, ks;
    for (i in o) {
        if (o.hasOwnProperty(i)) {
            ks = i.split('|');
            for (j = 0, jl = ks.length; j < jl; j++) ret[ks[j]] = o[i];
        }
    }
    return ret;
};

const cleanJson = json => json.replace(/(^[\s\t]*\/\*([\s\S]*?)\*\/)|(^[\s\t]*\/\/(.*)$)/gm, '');

const getCommentFn = (pre, post) => cnt => (pre + cnt + post);

module.exports = {
    checkns,
    cleanJson,
    createEntry,
    getFileExtension,
    getFileTime,
    getCommentFn,
    getIterator,
    isArray,
    isString,
    jsonFromStr,
    objMultiKey,
    replaceAll,
    replaceLinenumbers,
    solveJson,
    uniquearr,
    validateJson
};