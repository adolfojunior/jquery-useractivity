/*
 * @author Adolfo Jr.
 * Usage:
	$(document).userActivity({ seconds: 5 })
	.on( 'active.userActivity idle.userActivity', function( e, state, time ){
		...
	})
	.on( 'idle.userActivity', function( e, state, time ){
		...
	});
 */
(function( $ ){
	
	// private functions.
	
	function watchActivity( element ){
		
		var data = $.data( element, 'userActivityData' );
		
		data.timeoutId = setTimeout(function(){
			activityToggle( element );
		}, data.timeout );
	}
	

	function lockListener( data ) {
		// lock the listener to avoid flow of events.
		data.activityId = setTimeout(function(){
			data.activityId = false;
		}, 500);
	}
	
	function activityToggle( element ){
		
		var time = +new Date();
		var data = $.data( element, 'userActivityData' );
		var elapsed = time - data.lastTime;
		
		// toggle the state.
		data.idle = !data.idle;
		data.timeoutId = false;
		
		// if browser trigger before the spected.
		if ( data.idle && ( elapsed < data.timeout ) ){
			// some activity!
			data.idle = false;
			if ( data.enabled ){
				watchActivity( element );
			}
			return;
		}
		
		var state = ( data.idle ? 'idle' : 'active' );
		// update toggle time.
		data.lastTime = time;
		// update activity.
		$.data( element, 'userActivity', state );
		// custom userActivity event.
		$( element ).trigger( $.Event(state + '.userActivity'), [ state, elapsed ] );
	}
	
	function activityListener( e ){
		
		var data = $.data( this, 'userActivityData' );
		
		// avoid flow of events, like mousemove trigger many calls per second!
		if ( data.activityId ){
			return;
		} else {
			lockListener( data );
		}
		
		log( 'Activity event ' + e.type, data, this, arguments );
		
		// clear any existing timeout
		if ( data.timeoutId ){
			clearTimeout( data.timeoutId );
		}
		
		// if the idle timer is enabled
		if ( data.enabled ){
			// user is not long idle.
			if ( data.idle ){
				activityToggle( this );
			}
			watchActivity( this );
		}
	}
	
	var namespace = {
		
        init: function ( options ){
			
            return this.each(function(){
                
				var $this = $( this ),
					data = $.data( this, 'userActivityData' );
				
                // if the plugin hasn't been initialized yet.
                if ( !data ){
					
					// defaults stored in the element.
					data = $.extend({
						// user is idle.
						idle: false,
						// starts immediatily or wait user iteration.
						start: true,
						// timer is enabled.
						enabled: true,
						// time interval that user is considered idle, 1 minute default.
						timeout: 60000,
						// activity events
						events: 'mousemove mousedown mousewheel DOMMouseScroll keydown touchstart touchmove'
					}, options);
					
					// save activity data.
					$.data( this, 'userActivity', data.idle ? 'idle' : 'active' );
                    $.data( this, 'userActivityData', data );
					
					// start to monitoring user now.
                    data.lastTime = +new Date();
                    
					if ( data.start ){
						watchActivity( this );
					}
					
					// Handle user events with plugin namespace.
					var activityEvents = ( $.trim( data.events ) + ' ' ).split(' ').join('.userActivity ');
					
					$this.on( activityEvents, activityListener );
					
					// callback!
					if ( data.onIdle ){
						$this.on( 'idle.userActivity', data.onIdle );
						delete data.onIdle;
					}
					if ( data.onActive ){
						$this.on( 'active.userActivity', data.onActive );
						delete data.onActive;
					}
					if ( data.onState ){
						$this.on( 'idle.userActivity active.userActivity', data.onState );
						delete data.onState;
					}
                }
            });
        },
		
        destroy: function (){
			
            return this.each(function (){
				
                var $this = $(this), data = $this.data( 'userActivityData' );
				// set to disabled
				data.enabled = false;
				// clear any pending timeouts
				if ( data.timeoutId ){
					clearTimeout( data.timeoutId );
				}
                // clear data and events.
                $this.off( '.userActivity' );
				$this.removeData( 'userActivity' );
                $this.removeData( 'userActivityData' );
            });
        },
		
		state: function( ){
			return $.data( this[0], 'userActivity' );
		},
		
        time: function( ){
			return ( +new Date() ) - $.data( this[0], 'userActivityData' ).lastTime;
        }
    };
	
    $.fn.userActivity = function( method ){
        if ( namespace[ method ] ){
            return namespace[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ) );
        } else if ( typeof method === 'object' || !method ){
            return namespace.init.apply( this, arguments );
        } else {
            $.error( 'Method ' + method + ' does not exist on jQuery.userActivity' );
        }
    };
	
})( jQuery );
