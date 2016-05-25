/**
 * Component component
 */
var ndplComponent = Vue.extend({

    data: function() {
        return {
            loaded: false,
            hide_sample_code: false
        }
    },

    props: {
        component: {
            required: true
        }
    },

    computed: {
        inline_styles: function() {
            var _this = this,
                styles = '';

            // Inline style are only applied after the component has fully loaded
            if(_this.loaded) {
                if(_this.component.options.sample_min_height) {
                    styles += 'min-height:' + _this.component.options.sample_min_height + 'px;';
                }
            }

            return styles;
        }
    },

    watch: {
        'component.html': function() {

            // Apply syntax highlighting when component html is loaded
            if(this.component.html.length) {
                var block = this.$el.querySelector('pre code');

                hljs.highlightBlock(block);
            }
        },
        '$root.mobile_view': function(newVal) {

            // Toggle show code base on mobile view
            this.component.code_show = ! newVal;
        }
    },

    ready: function() {
        var _this = this;

        // Monitor scroll and resize events and update navigation active state appropirately
        window.addEventListener('scroll', _this.updateActive);
        window.addEventListener('resize', _this.updateActive);

        // Listen for loaded event
        _this.$on('loaded', function() {

            _this.setHideSample(function() {
                _this.loaded = true;
            });
        });

        // Listen for resizing event
        _this.$on('resizing', function(is_resizing) {
            _this.loaded = false;

            if(!is_resizing) {
                _this.setHideSample(function() {
                    _this.loaded = true;
                });
            }
        });
    },

    methods: {

        /**
         * Update component active in navigation.
         */
        updateActive: function() {
            var _this = this;

            // If scroll position is great than or equal to component offset top - 60 pixels
            // and scroll position is less than component offset top plus component height plus 60 pixels
            // and active component is not this component
            if(_this.$root.scroll_position >= _this.$el.offsetTop - 60 &&
                _this.$root.scroll_position < _this.$el.offsetTop + _this.$el.offsetHeight) { // &&
                //_this.$root.active_components.indexOf(_this.component) == -1) {

                // If not currently auto scrolling to component
                // and component is not active
                if(!_this.$root.scrolling_to &&
                   !_this.isActive(_this.component)) {

                    // Set this component to active
                    _this.$root.active_components.push(_this.component);
                    _this.$root.open_group = null;
                    _this.$root.updateHash(_this.component.id);
                }
            } else {

                // If not currently auto scrolling to component
                if(!_this.$root.scrolling_to) {

                    // Loop through active components and remove this component
                    for (var i = 0; i < _this.$root.active_components.length; i++) {
                        var component = _this.$root.active_components[i];
                        
                        if (component.id === _this.component.id) {
                            _this.$root.active_components.splice(i, 1);
                            
                            return;
                        }
                    }
                }
            }
        },

        /**
         * Is component active in navigation.
         *
         * @param component
         * @returns {boolean}
         */
        isActive: function(component) {
            var _this = this;

            for (var i = 0; i < _this.$root.active_components.length; i++) {
                var c = _this.$root.active_components[i];

                if (component.id === c.id) {
                    return true;
                }
            }

            return false;
        },

        /**
         * Should invert text based on hex brightness.
         *
         * @param hex
         * @returns {boolean}
         */
        shouldInvertText: function(hex) {
            var rgb = this.$root.convertHexToRgb(hex),
                brightness = this.$root.getColorBrightness(rgb);

            return brightness > 210;
        },

        /**
         * Should apply border based on hex brightness.
         *
         * @param hex
         * @returns {boolean}
         */
        shouldApplyBorder: function(hex) {
            var rgb = this.$root.convertHexToRgb(hex),
                brightness = this.$root.getColorBrightness(rgb);
            
            return brightness > 240;
        },

        /**
         * Set component sample element to be hidden if the sample
         * itself is hidden in the assets CSS stylesheet.
         *
         * @param callback
         */
        setHideSample: function(callback) {
            callback = typeof callback !== 'undefined' ?  callback : function() {};
            
            var _this = this;

            _this.hide_sample_code = false;

            setTimeout(function() {
                if(_this.$el.querySelector('.ndpl-component__code')) {
                    if (_this.$el.querySelector('.ndpl-component__sample').offsetHeight <= 74 &&
                        !_this.component.options.sample_always_show) {
                        _this.hide_sample_code = true;
                    }

                    if (!_this.$root.mobile_view &&
                        _this.component.options.sample_min_height) {
                        _this.hide_sample_code = false;
                    }
                }

                callback();
            }, 0);
        },

        /**
         * Is sample code visible.
         *
         * @returns {boolean}
         */
        isCodeVisible: function() {
            var _this = this;

            return ! _this.hide_sample_code;
        }
    }
});
Vue.component('ndpl-component', ndplComponent);

/**
 * Group component
 */
var ndplGroup = Vue.extend({

    props: {
        group: {
            required: true
        }
    }
});
Vue.component('ndpl-group', ndplGroup);

/**
 * Script component
 */
var ndplScript = Vue.extend({

    props: {
        script: {
            required: true
        }
    },

    methods: {

        /**
         * Loads TypeKit.
         */
        loadTypekit: function() {
            var _this = this;

            try {
                Typekit.load({
                    async: true
                });
            } catch(e) {};
        }
    }
});
Vue.component('ndpl-script', ndplScript);

/**
 * Vue instance
 */
new Vue({
    el: 'html',

    data: {
        intro: null,
        project_logo: null,
        project_name: null,
        project_url: null,
        copyright_start_year: null,
        client_name: null,
        client_url: null,
        creators: {},
        groups: {},
        theme: {},
        assets: {
            css: [],
            js: []
        },
        font_libraries: {
            typekit_code: null,
            google_web_fonts: null,
            typography_web_fonts: null
        },
        log: {
            error: [],
            info: []
        },
        components_count: 0,
        components_loaded_count: 0,
        loaded: false,
        resizing: false,
        typekit_loaded: false,
        scroll_position: 0,
        prev_scroll_position: 0,
        active_group: null,
        active_components: [],
        open_group: null,
        scrolling_to: false,
        window_outer_width: 0,
        breakpoint: 960,
        mobile_view: false,
        open_nav: false,
        rtime: new Date(1, 1, 2000, 12,00,00),
        timeout: false,
        delta: 200
    },

    computed: {
        project: function() {
            if(this.project_name && this.project_url) {
                return '<a href="' + this.project_url + '" target="_blank"><span>' + this.project_name + '</span></a>';
            }

            if(this.project_name && !this.project_url) {
                return this.project_name;
            }

            return null;
        },

        copyright_year: function() {
            var date = new Date();

            if(date.getFullYear() == this.copyright_start_year) {
                return this.copyright_start_year;
            }

            return this.copyright_start_year + ' - ' + date.getFullYear();
        },

        client: function() {
            if(this.client_name && this.client_url) {
                return '<a href="' + this.client_url + '" target="_blank">' + this.client_name + '</a>';
            }

            if(this.client_name && !this.client_url) {
                return this.client_name;
            }

            return null;
        },

        all_creators: function() {
            var formattedCreators = '';

            if(this.creators.length && this.creators[0].name) {
                for (var i = 0; i < this.creators.length; i++) {
                    prefix = i === this.creators.length - 1 ? ' & ' : ', ';
                    url = this.creators[i].url;
                    name = this.creators[i].name.replace(' ', '&nbsp;');

                    formattedCreators += prefix + '<a href="' + url + '" target="_blank">' + name + '</a>';
                }

                return formattedCreators.substring(2);
            }

            return null;
        }
    },

    watch: {
        loaded: function() {
            var _this = this;

            _this.scrollTo(window.location.hash);

            _this.$broadcast('loaded');
        }
    },

    ready: function() {
        var _this = this;

        _this.loadDataFile();

        _this.window_outer_width = window.outerWidth;

        _this.mobile_view = _this.window_outer_width >= _this.breakpoint ? false : true;

        window.addEventListener('scroll', _this.setScrollPosition);
        window.addEventListener('resize', function() {
            _this.window_outer_width = window.outerWidth;
            _this.setScrollPosition();

            _this.mobile_view = _this.window_outer_width >= _this.breakpoint ? false : true;

            _this.rtime = new Date();

            if (_this.timeout === false) {
                _this.timeout = true;
                setTimeout(_this.resizeFadeToggle, _this.delta);
            }
        });
    },

    methods: {

        /**
         * Reads the data.json file.
         */
        loadDataFile: function () {
            var _this = this;

            _this.$http.get('./data.json').then(function (response) {

                _this.initData(response.data, function() {
                    _this.loadIntro();

                    if(_this.$data.groups.length) {
                        _this.setupGroups();
                    } else {
                        _this.logInfo('You need to add a component to your library before it can be loaded.<br/>You can either do this manually by editing your <code>data.json</code> file,<br/> or you can use the command line helper: <code>patterns new [group_name/component_name]</code>');
                    }
                });
            });
        },

        /**
         * Initilise data bindings.
         *
         * @param data
         */
        initData: function(data, callback) {
            callback = typeof callback !== 'undefined' ?  callback : function() {};

            var _this = this;

            for(var key in data) {
                _this.$set(key, data[key]);
            }

            callback();
        },

        /**
         * Update URL hash.
         *
         * @param hash
         */
        updateHash: function(hash) {
            history.pushState ? history.pushState(null, null, '#' + hash) : location.hash = hash;
        },

        /**
         * Load intro Markdown.
         */
        loadIntro: function() {
            var _this = this;

            _this.$http.get('./templates/intro.md').then(function(response) {
                _this.$set('intro', marked(response.data));
            }, function() {
                _this.logError('Failed to load <strong>intro</strong> template from <code>/templates/intro.md</code>. Is it missing?');
            });
        },

        /**
         * Setup component groups.
         */
        setupGroups: function() {
            var _this = this;

            // Loop through the groups
            for (var i = 0; i < _this.groups.length; i++) {
                var group = _this.groups[i];

                // Set group navigation navigation
                var groupId = 'group-' + group.name;
                _this.$set('groups[' + i + '].id', groupId);
                _this.$set('groups[' + i + '].active', false);

                // Count components
                _this.components_count += group.components.length;

                // Add group components to group
                for (var j = 0; j < group.components.length; j++) {

                    // Set component default variables
                    _this.$set('groups[' + i + '].components[' + j + '].id', 'component-' + group.components[j].name);
                    _this.$set('groups[' + i + '].components[' + j + '].group_id', groupId);
                    _this.$set('groups[' + i + '].components[' + j + '].active', false);
                    _this.$set('groups[' + i + '].components[' + j + '].options', group.components[j].options ? group.components[j].options : false);
                    _this.$set('groups[' + i + '].components[' + j + '].options.sample_always_show', group.components[j].options.sample_always_show ? group.components[j].options.sample_always_show : false);
                    _this.$set('groups[' + i + '].components[' + j + '].options.sample_mobile_hidden', group.components[j].options.sample_mobile_hidden ? group.components[j].options.sample_mobile_hidden : false);
                    _this.$set('groups[' + i + '].components[' + j + '].options.sample_dark_background', group.components[j].options.sample_dark_background ? group.components[j].options.sample_dark_background : false);
                    _this.$set('groups[' + i + '].components[' + j + '].code_show', false);
                    _this.$set('groups[' + i + '].components[' + j + '].type', group.components[j].type ? group.components[j].type : 'standard');

                    // Add html and description properties to the component object.
                    _this.$set('groups[' + i + '].components[' + j + '].html', '');
                    _this.$set('groups[' + i + '].components[' + j + '].description', '');

                    _this.loadComponent(_this.groups[i].components[j]);
                }
            }
        },

        /**
         * Load component files.
         *
         * @param component
         */
        loadComponent: function(component) {
            var _this = this,
                component_path = './components/' + component.group + '/' + component.name;

            // Get and set component markup
            _this.$http.get(component_path + '/markup.html').then(function (response) {
                component.html = response.data;
                _this.areComponentsLoaded();
            }, function () {
                _this.logError('HTML file for <strong>' + component.name + '</strong> component failed to load from <code>/' + component_path + '/html.md</code>');
            });

            // Get and set component description
            _this.$http.get(component_path + '/description.md').then(function (response) {
                component.description = marked(response.data);
                _this.areComponentsLoaded();
            }, function () {
                _this.logError('Description file for <strong>' + component.name + '</strong> component failed to load from <code>/' + component_path + '/description.md</code>');
            });
        },

        /**
         * Increment components loaded.
         */
        areComponentsLoaded: function() {
            var _this = this;

            _this.components_loaded_count += 1;

            if (_this.components_loaded_count === _this.components_count * 2) {

                setTimeout(function() {
                    _this.loaded = true;
                }, 2000);
            }
        },

        /**
         * Add to log.
         *
         * @param message
         * @param data
         * @param type
         */
        addLog: function(message, data, type) {
            var _this = this;

            type = typeof type !== 'undefined' ? type : 'error';
            data = typeof data !== 'undefined' ? data : null;

            _this.log[type].push(message);
            console[type]('[Pattern Library warn]: ' + message);

            if(data) {
                console[type](data);
            }
        },

        /**
         * Log error helper.
         *
         * @param message
         * @param data
         */
        logError: function(message, data) {
            var _this = this;

            _this.addLog(message, data, 'error');
        },

        /**
         * Log info helper.
         *
         * @param message
         * @param data
         */
        logInfo: function(message, data) {
            var _this = this;

            _this.addLog(message, data, 'info');
        },

        /**
         * Set scroll position.
         */
        setScrollPosition: function() {
            var _this = this,
                doc = document.documentElement,
                top = doc && doc.scrollTop || document.body.scrollTop;
            
            _this.prev_scroll_position = _this.scroll_position;
            _this.scroll_position = top;
        },

        /**
         * Get scroll direction.
         *
         * @returns {string}
         */
        getScrollDirection: function() {
            var _this = this;

            return _this.prev_scroll_position < _this.scroll_position ? 'down' : 'up';
        },

        /**
         * Scroll to element.
         *
         * @param e
         */
        scrollToHref: function(e) {
            var _this = this;

            _this.scrollTo(e.target.hash);
        },

        /**
         * Animate scroll to.
         *
         * @param hash
         */
        scrollTo: function(hash) {
            var _this = this,
                offset = _this.mobile_view ? 79 : 30;

            if(!hash) return;

            _this.scrolling_to = true;

            smoothScroll.animateScroll(hash, null, {
                offset: offset,
                callback: function() {
                    _this.scrolling_to = false;
                    _this.open_nav = false;
                }
            });
        },

        /**
         * Toggle navigation.
         */
        toggleNav: function() {
            var _this = this;

            _this.open_nav = ! _this.open_nav;
        },

        /**
         * Toggle open groups.
         *
         * @param group
         */
        toggleOpenGroups: function(group) {
            var _this = this;
            
            _this.open_group = _this.open_group == group.id ? null : group.id;
        },

        /**
         * Toggle container fade on resize.
         */
        resizeFadeToggle: function() {
            var _this = this;

            _this.resizing = true;
            _this.$broadcast('resizing', true);

            if (new Date() - _this.rtime < _this.delta) {
                setTimeout(_this.resizeFadeToggle, _this.delta);
            } else {
                _this.timeout = false;

                setTimeout(function() {
                    _this.resizing = false;
                    _this.$broadcast('resizing', false);
                }, 1000);
            }
        },

        /**
         * Convert hex color value to rgb color values.
         *
         * @param hex
         * @returns {{r: number, g: number, b: number}}
         */
        convertHexToRgb: function(hex) {
            // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
            var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
            hex = hex.replace(shorthandRegex, function(m, r, g, b) {
                return r + r + g + g + b + b;
            });

            var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
        },

        /**
         * Get color brightness value from rgb color values.
         *
         * @param rgb
         * @returns {number}
         */
        getColorBrightness: function(rgb) {
            return Math.round(((parseInt(rgb.r) * 299) + (parseInt(rgb.g) * 587) + (parseInt(rgb.b) * 114)) /1000);
        }
    }
});