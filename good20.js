// Begin Plugin Code
/**
 * Transforms data object into URL query string.
 *
 * @param  object object The object to be converted into query string.
 * @return string        The Object transformed into query string.
 */
function object_to_query_string( object ) {
	return Object.entries( object ).map( ( [key, val] ) => `${key}=${val}` ).join('&');
}

class YoutubePlaylistModule {
	constructor({
		api_key,
		element,
		playlist_id,
		max_results = '5',
		query_options = {}
	}) {
		this.api_key        = api_key;
		this.element        = element;
		this.playlist_id    = playlist_id;
		this.max_results    = max_results;
		this.query_options  = query_options;
		this.request_domain = 'https://www.googleapis.com/youtube/v3/playlistItems';
	}

	/**
	 * Initializes module
	 */
	init() {
		if ( this.element.length ) {
			Array.from( this.element ).map( item => {
				this._get_data( item.getAttribute( 'data-playlist' ), item );
			});
		}

		if ( this.playlist_id ) this._get_data( this.playlist_id, this.element );
	}

	/**
	 * Fetches YouTube API data.
	 *
	 * @param  string playlist_id The playlist ID to pull the videos from.
	 * @param  object element     The HTML element to attach the playlist to.
	 */
	_get_data( playlist_id, element ) {
		const query = {
			part: 'snippet',
			playlistId: playlist_id,
			maxResults: this.max_results,
			key: this.api_key
		};

		fetch( this.request_domain + '?' + object_to_query_string( query ) )
			.then( response => response.json() )
			.then( json_data => {
				this._parse_data( json_data, element );
			})
			.catch( error => console.error( error ) ); // eslint-disable-line no-console
	}

	/**
	 * Method that returns the playlist video items.
	 *
	 * @param  object data Data for each playlist video item.
	 * @return string      The playlist markup
	 */
	playlist_items_template( data ) {
		return `<li>
			<a class="ypm_video_items" href="#" data-id="${ data.snippet.resourceId.videoId }">
				<img src="${ data.snippet.thumbnails.medium.url }" />
				<p>${ data.snippet.title }</p>
			</a>
		</li>`;
	}

	/**
	 * Method that returns the playlist template build out.
	 *
	 * @param  object response The data returned from the YouTube API.
	 * @return string          The playlist markup
	 */
	playlist_template( response ) {
		return `<div class="ypm_youtube-video-playlist">
			<div class="ypm_video-player">
				<iframe class="ypm_iframe" src="" width="560" height="315" frameborder="0" allowfullscreen></iframe>
			</div>

			<div class="ypm_video-list-wrapper">
				<ul class="ypm_video-list">
					${ response.items.map( data => this.playlist_items_template( data ) ).join('') }
				</ul>
			</div>
		</div>`;
	}

	/**
	 * Parse response data into playlist HTML.
	 *
	 * @param  object response The data returned from the YouTube API.
	 * @param  object element  The DOM element to attach the playlist.
	 */
	_parse_data( response, element ) {
		const template       = this.playlist_template( response );
		const fragment       = new DOMParser().parseFromString( template, 'text/html' );
		const playlist       = fragment.body.childNodes[0];
		const video_items    = playlist.getElementsByClassName( 'ypm_video_items' );
		const iframe         = playlist.getElementsByClassName( 'ypm_iframe' )[0];
		const autoplay_state = this.query_options.autoplay;

		// Other params: https://developers.google.com/youtube/player_parameters
		const video_url = id => `https://www.youtube.com/embed/${ id }?${ object_to_query_string( this.query_options ) }`;

		Array.from( video_items ).map( ( item, index, this_array ) => {
			if ( index === 0 ) {
				iframe.setAttribute( 'src', video_url( item.getAttribute( 'data-id' ) ) );
				item.classList.add( 'ypm_active' );
				this.query_options.autoplay = 0;
			} else {
				this.query_options.autoplay = autoplay_state;
			}

			item.addEventListener( 'click', function( event ) {
				event.preventDefault();

				this_array.map( item => item.classList.remove( 'ypm_active' ) );
				this.classList.add( 'ypm_active' );
				iframe.setAttribute( 'src', video_url( this.getAttribute( 'data-id' ) ) );
			});
		});

		element.appendChild( playlist );
	}
}

// End Plugin Code

// Implantation
const playlist_element = document.getElementsByClassName( 'playlist-1' );

const playlist_1 = new YoutubePlaylistModule({
  api_key: 'AIzaSyCuNlBJFycaJdPUy35sIHbCw8wG_lYLz4E',
  element: playlist_element,
  max_results: 20,
  query_options: {
    showinfo: 0,
    autoplay: 1,
    rel: 0,
  }
});

playlist_1.init();
