/* - Remove homepage tiles audio and video autoplay - C3 */
function removeAutoPlayingTrailer(){
	document.querySelectorAll(".previewModal--player_container video").forEach(
		function(player){
			if(!player.paused || !player.muted){
				player.muted = true;
				player.pause();
			}
		}
	);
}
let autoplayInterval = setInterval(removeAutoPlayingTrailer, 100); /* 100ms was arbitrary chosen */

/* Clean up interval when page unloads to prevent memory leaks */
window.addEventListener('unload', () => {
	clearInterval(autoplayInterval);
});
