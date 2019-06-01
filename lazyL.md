
# Lazy loading for eager UX


## Naive way

If you are doing SSR or WebPack - mostly you load all at once, user sees entire page after everything is ready.

## Basics of lazy/eager

For start, you can load css layout (without font family) in head, and start a data fetch: so data is in flight ASAP.
And since layout is in head: page won't be shown without proper layout.
You may chose to also start loading any large assets, for example fast-tracking a large media element. The browser tries to load
media last, but some, maybe a background image can help page finish faster if they start loading earlier.  
Then get out of head as soon as you can so page body can start rendering. 


For end, you can load font, and then the full css (minus layout) so each 'block' can look the way it should.
Also load any 3rd party ops and marketing libs.

Any components you need would will also start loading in the middle with any dependencies they need (and of course load them only once if you have
central definitions)

Already you are better than naive way, for example user can gleam the layout and watch it fill in. A part of knowing the medium is 
knowing how it works, a web page is not a magazine page. 

Also, maybe some block should be blurred or maybe a block .delayShowing till load is done for a nicer UX. Using .delayShowing for entire page is 
not what you want to do to a user of your app. You want to 'animate' in the page blocks. Use .blue and .delayShowing sparingly in limited ways.

## Advanced lazy/eager

This requires creativity. Is there a block in your page or screen that you can show before the end? Think. While in the shower. Sleep on it.
You can look for these opportunities if you slow down the network speed in browser's development tools - and watch the 'waterfall' 
shown there. If you find that, before you trigger your 'end' (fonts and full style) you are doing very good.