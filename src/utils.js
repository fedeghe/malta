/* eslint-disable no-console */
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
    getFileTime = thepath => fs.existsSync(thepath)
        && fs.statSync(thepath).mtime.getTime(),

    /**
     * get a unique array given an array
     *
     * @param      {<type>}  a       { parameter_description }
     * @return     {Array}   { description_of_the_return_value }
     */
    // uniquearr: a => a.filter((el, i) => a.indexOf(el) == i),
    uniquearr = a => {
        const h = {};
        return a.filter(el => h[el] ? false : (h[el] = true));
    },

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
        if (s === undefined) {
            return false;
        }
        const str = String(s);
        let i = 0;
        const len = str.length;

        const skipWs = () => {
            while (i < len && /\s/.test(str[i])) i++;
        };

        const parseString = () => {
            const quote = str[i++];
            let res = '';
            while (i < len && str[i] !== quote) {
                if (str[i] === '\\' && i + 1 < len) {
                    i++;
                    res += str[i++];
                } else {
                    res += str[i++];
                }
            }
            if (i < len) i++;
            return res;
        };

        const parseLiteral = () => {
            let start = i;
            let depth = 0;
            while (i < len) {
                const ch = str[i];
                if (ch === '{' || ch === '[') {
                    depth++;
                    i++;
                } else if (ch === '}' || ch === ']') {
                    if (depth === 0) break;
                    depth--;
                    i++;
                } else if (ch === ',' && depth === 0) {
                    break;
                } else {
                    i++;
                }
            }
            const val = str.slice(start, i).trim();
            if (val === 'true') return true;
            if (val === 'false') return false;
            if (val === 'null') return null;
            if (/^-?\d+(\.\d+)?$/.test(val)) return parseFloat(val);
            return val;
        };

        const parseValue = () => {
            skipWs();
            if (i >= len) return undefined;
            const ch = str[i];
            if (ch === '"' || ch === "'") return parseString();
            if (ch === '{') return parseObject();
            if (ch === '[') return parseArray();
            return parseLiteral();
        };

        const parseObject = () => {
            const obj = {};
            if (str[i] === '{') i++;
            while (i < len) {
                skipWs();
                if (i < len && (str[i] === '}' || str[i] === ']')) { i++; break; }
                let key = '';
                if (str[i] === '"' || str[i] === "'") {
                    key = parseString();
                } else {
                    while (i < len && /[a-zA-Z0-9_$]/.test(str[i])) key += str[i++];
                }
                skipWs();
                if (!(i < len && str[i] === ':')) {
                    throw new Error('Invalid object syntax');
                }
                i++; // skip :
                obj[key] = parseValue();
                skipWs();
                if (i < len && str[i] === ',') i++;
                else break;
            }
            return obj;
        };

        const parseArray = () => {
            const arr = [];
            i++;
            while (i < len) {
                skipWs();
                if (i < len && str[i] === ']') { i++; break; }
                arr.push(parseValue());
                skipWs();
                if (i < len && str[i] === ',') i++;
            }
            return arr;
        };

        try {
            skipWs();
            if (i < len && str[i] === '{') {
                return parseObject();
            }
            // implicit object: wrap as if {s}
            return parseObject();
        } catch (e) {
            return {};
        }
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
        const len = els.length;
        return {
            reset: () => { i = 0; },
            hasNext: () => i < len,
            next: () => els[i++],
            size: () => len
        };
    },

    /**
     * [replaceAll description]
     * @param  {[type]} tpl     [description]
     * @param  {[type]} obj     [description]
     * @param  {[type]} options [description]
     * @return {[type]}         [description]
     */
    replaceAll = (tpl, obj, options) => {
        let start = '%',
            end = '%',
            fb = null,
            clean = false,
            straight = true,
            tmp, last;

        if (typeof options !== 'undefined') {
            if ('delim' in options) {
                [start, end] = options.delim;
            }
            if ('fb' in options) {
                fb = options.fb;
            }
            clean = !!options.clean;
        }

        // reg = new RegExp('\\' + start + '(\\\+)?([A-z0-9-_\.]*)' + '\\' + end, 'g');
        const reg = new RegExp(`\\${start}(\\+)?([A-z0-9-_.]*)\\${end}`, 'g');

        while (straight) {
            if (!(tpl.match(reg))) {
                return tpl;
            }
            // eslint-disable-next-line complexity
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

        const aVarIn = v => v.match(/\$([A-z0-9-_/.]+)\$/);

        return (function _ (o) {
            let y, j;
            for (j in o) {
                if (!Object.prototype.hasOwnProperty.call(o, j)) continue;
                switch (typeof o[j]) {
                    case 'string':
                        y = aVarIn(o[j]);
                        while (y) {
                            o[j] = o[j].replace(
                                `$${y[1]}$`,
                                checkns(y[1], obj) || ''
                            );
                            if (maxSub-- < 0) {
                                console.log('[ERROR] it seems like variable json has looping placeholders!');
                                const e = new Error();
                                e.stop = true;
                                throw e;
                            }
                            y = aVarIn(o[j]);
                        }
                        break;
                    case 'object':
                        o[j] = _(o[j]);
                        break;
                    default: ;
                }
            }
            return o;
        })(obj);
    },

    cleanJson = json => json.replace(/(^[\s\t]*\/\*([\s\S]*?)\*\/)|(^[\s\t]*\/\/(.*)$)/gm, ''),

    replaceLinenumbers = tpl => (
        tpl.split(NL)
            .map(
                (line, i) => line.replace(/__LINE__/g, i + 1)
            ).join(NL)
    );

module.exports = {
    cleanJson,
    createEntry,
    getFileExtension,
    getFileTime,
    uniquearr,
    checkns,
    jsonFromStr,
    isArray,
    isString,
    getIterator,
    replaceAll,
    replaceLinenumbers,
    validateJson,
    solveJson
};
