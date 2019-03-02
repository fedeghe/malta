const fs = require('fs'),
    // eslint-disable-next-line quotes
    NL = "\n",

    /**
    * Creates an entry. element
    *
    * @param      {<type>}            path    The path
    * @return     {(Object|boolean)}  { description_of_the_return_value }
    */
    createEntry = path => fs.existsSync(path) && {
        content: fs.readFileSync(path).toString(),
        time: fs.statSync(path).mtime.getTime(),
        cachevalid: true
    },

    /**
     * Gets the file extension.
     *
     * @param      {<type>}  fname   The filename
     * @return     {<type>}  The file extension.
     */
    getFileExtension = fname => (fname.split('.').pop()),

    /**
     * Gets the file time.
     *
     * @param      {<type>}  path    The path
     * @return     {<type>}  The file time.
     */
    getFileTime = thepath => fs.existsSync(thepath) && fs.statSync(thepath).mtime.getTime(),


    /**
     * get a unique array given an array
     *
     * @param      {<type>}  a       { parameter_description }
     * @return     {Array}   { description_of_the_return_value }
     */
    // uniquearr: a => a.filter((el, i) => a.indexOf(el) == i),
    uniquearr = (a, h = {}) => a.filter(el => h[el]
        ? false
        : (h[el] = true)),

    /**
     * checks if a ns exists
     *
     * @param      {<type>}           ns      { parameter_description }
     * @param      {(number|string)}  ctx     The context
     */
    checkns = (ns, ctx) => {
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
    },

    /**
     * json from a string
     *
     * @param      {string}   s       { parameter_description }
     * @return     {boolean}  { description_of_the_return_value }
     */
    jsonFromStr = s => {
        let r = {};
        if (s === undefined) {
            return false;
        }
        try {
            eval(`r = {${s}}`);
        } catch (e) {
            return r;
        }
        return r;
    },

    /**
     * [isArray description]
     * @param  {[type]}  o [description]
     * @return {Boolean}   [description]
     */
    isArray = o => {
        if (Array.isArray && Array.isArray(o)) {
            return true;
        }
        const t1 = String(o) !== o,
            t2 = {}.toString.call(o).match(/\[object\sArray\]/);
        return t1 && !!(t2 && t2.length);
    },

    /**
     * [isString description]
     * @param  {[type]}  o [description]
     * @return {Boolean}   [description]
     */
    isString = o => typeof o === 'string' || o instanceof String,

    /**
     * [getIterator description]
     * @param  {Array} els [description]
     * @return {Iterator}     [description]
     */
    getIterator = els => {
        let i = 0;
        return {
            reset: () => {i = 0;},
            hasNext: () => i < els.length,
            next: () => els[i++],
            size: () => els.length
        };
    },

    /**
     * [replaceAll description]
     * @param  {[type]} tpl     [description]
     * @param  {[type]} obj     [description]
     * @param  {[type]} options [description]
     * @return {[type]}         [description]
     */
    // eslint-disable-next-line max-lines-per-function
    replaceAll = (tpl, obj, options) => {
        let start = '%',
            end = '%',
            fb = null,
            clean = false,
            reg,
            straight = true,
            // str,
            last;
        const fromFunction = S1 => {
                const tmp = obj(S1);
                return (tmp !== start + S1 + end) ? obj(S1) : S1;
            },
            fromObj = S1 => {
                const tmp = typeof obj[S1];
                switch(tmp) {
                    case 'function':
                        return obj[S1](S1);
                    case 'object':
                        return '';
                    default:
                        return obj[S1];
                }
            },
            maybeFromNs = S1 => {
                if (S1.match(/\./)) {
                    last = checkns(S1, obj);
                    if (last) {
                        return typeof last === 'function'
                            ? last(S1)
                            : last;
                    }
                }
                // but do not go deeper
                straight = false;
                return fb !== null
                    ? fb(S1)
                    : clean
                        ? ''
                        : start + S1 + end;
            },
            doReplace = (str, enc, $1, _t) => {
                if (typeof obj === 'function') {
                    _t = fromFunction($1);
                } else if ($1 in obj) {
                    _t = fromObj($1);
                } else {
                    _t = maybeFromNs($1);
                }
                return enc ? encodeURIComponent(_t) : _t;
            };

        if (typeof options !== 'undefined') {
            if ('delim' in options) {
                [ start, end ] = options.delim;
            }
            if ('fb' in options) {
                fb = options.fb;
            }
            clean = !!options.clean;
        }

        // eslint-disable-next-line prefer-template
        reg = new RegExp('\\' + start + '(\\\+)?([A-z0-9-_\.]*)' + '\\' + end, 'g');

        while (straight) {
            if (!(tpl.match(reg))) {
                return tpl;
            }
            tpl = tpl.replace(reg, doReplace);
        }
        return tpl;
    },

    validateJson = json => {
        try {
            JSON.parse(json);
        } catch (e) {
            return false;
        }
        return true;
    },

    solveJson = (obj, lim) => {
        let maxSub = lim || 1E3;
        return (function _(o) {
            let y, j;
            for (j in o) {
                switch (typeof o[j]) {
                    case 'string':
                        while (y = o[j].match(/\$([A-z0-9-_/.]+)\$/)) {
                            o[j] = o[j].replace(
                                `$${y[1]}$`,
                                checkns(y[1], obj) || ''
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
                    default: break;
                }
            }
            return o;
        })(obj);
    },

    replaceLinenumbers = tpl => (
        tpl.split(/\n/)
        .map(
            (line, i) => line.replace(/__LINE__/g, i + 1)
        ).join(NL)
    ),

    objMultiKey = o => {
        let ret = {}, i, j, jl, ks;
        for (i in o) {
            if (o.hasOwnProperty(i)) {
                ks = i.split('|');
                for (j = 0, jl = ks.length; j < jl; j++) ret[ks[j]] = o[i];
            }
        }
        return ret;
    },

    cleanJson = json => json.replace(/(^[\s\t]*\/\*([\s\S]*?)\*\/)|(^[\s\t]*\/\/(.*)$)/gm, ''),

    getCommentFn = (pre, post) => cnt => (pre + cnt + post);

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
