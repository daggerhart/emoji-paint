Vue.config.devtools = true;

function Message(text = '',type = 'success'){
  return {
    text: text,
    type: type
  }
}

let vm = new Vue({
  el: '#app',
  data: {
    backgroundEmoji: {},
    currentEmoji: {},
    palette: [],
    gridRows: 10,
    gridColumns: 12,
    grid: [],
    linebreak: "\n",
    emojiLibrary: [],
    emojiLibraryByCategory: {},
    backgrounds: [],
    backgroundSearchStrings: ['tree','square','skin'],
    librarySearch: '',
    message: Message()
  },
  mounted: function(){
    this.fetchEmojiLibrary();
  },
  methods: {
    /**
     * Fetch the emoji json file and process its data into the app
     */
    fetchEmojiLibrary: function(){
      axios
        .get('data/emoji.json')
        .then(response => {
          this.emojiLibrary = response.data;
          this.processEmojiLibrary();
        })
        .then(() => {
          this.setCurrentEmoji('deciduous_tree');
          this.setBackgroundEmoji('white_large_square');
          this.adjustGrid()
        });
    },

    /**
     * Process emoji data to make future operations easier
     */
    processEmojiLibrary: function(){
      for(let i=0; i < this.emojiLibrary.length; i++ ){
        let emoji = this.emojiLibrary[i];

        // provide a singular name
        emoji.name = this.emojiLibrary[i].aliases[0];
        emoji.emoji = this.cleanEmoji( emoji.emoji );

        // tag backgrounds
        for( let j=0; j < this.backgroundSearchStrings.length; j++) {
          if (emoji.name.indexOf(this.backgroundSearchStrings[j]) !== -1){
            this.backgrounds.push(emoji);
          }
        }

        // filter out those missing data
        if ( !_.isUndefined(emoji.emoji) ){
          if ( _.isUndefined(this.emojiLibraryByCategory[emoji.category]) ) {
            this.emojiLibraryByCategory[emoji.category] = [];
          }
          this.emojiLibraryByCategory[emoji.category].push(emoji);
        }

        this.emojiLibrary[i] = emoji;
      }
    },

    /**
     * Get an emoji object from the library
     * @param name
     */
    getEmoji: function(name){
      return _.find(this.emojiLibrary, {name: name});
    },

    /**
     * Remove the crud from single-character emoji
     * @param string
     */
    cleanEmoji: function(string){
      if (Array.from(string).length <= 2){
        string = string.replace(/[\u200B-\u200D\uFEFF\uFE0F]/g, '');
      }
      return string;
    },

    /**
     * Set the current emoji being used by the brush
     * @param name
     */
    setCurrentEmoji: function(name){
      this.currentEmoji = this.getEmoji(name);
    },

    /**
     * Set the background emoji
     * @param name
     */
    setBackgroundEmoji: function(name){
      this.backgroundEmoji = this.getEmoji(name);
      this.backgroundEmoji.isBackground = true;
    },

    /**
     * Loop through the grid and update all background emoji 
     */
    updateBackgroundEmoji: function(){
      for( let y=0; y < this.gridRows; y++){
        for( let x=0; x < this.gridColumns; x++ ){
          if( !_.isUndefined(this.grid[y][x].isBackground) && this.grid[y][x].isBackground ){
            Vue.set(this.grid[y], x, this.backgroundEmoji);
          }
        }
      }
    },

    /**
     * Set a message for a period of time
     *
     * @param message Message
     * @param timeout
     */
    flashNotification: function(message, timeout = 2000){
      this.message = message;
      setTimeout(() => this.message = Message(), timeout);
    },

    /**
     * Add an emoji to the palette if it doesn't already exist
     * @param name
     */
    addToPalette: function(name){
      if ( _.isUndefined( _.find(this.palette, {name: name} ))) {
        this.palette.push(this.getEmoji(name));
        this.$emit('notification', Message('Added to Palette'));
      }
    },

    /**
     * Place the current emoji at the coordinates on the grid
     * @param x
     * @param y
     */
    paintCurrentEmojiOnGrid: function(x,y){
      // Reset the square to background emoji if re-clicking on current emoji
      if( this.grid[y][x].name === this.currentEmoji.name ) {
        Vue.set( this.grid[y], x, this.backgroundEmoji );
      }

      // Otherwise add current emoji to grid
      else {
        Vue.set(this.grid[y], x, this.currentEmoji);
      }
    },

    /**
     * Adjust the grid according to changes in the row and column numbers
     */
    adjustGrid: function(){
      // constrain rows
      if (this.grid.length > this.gridRows){
        this.grid = _.slice(this.grid, 0, this.gridRows)
      }

      for( let y=0; y < this.gridRows; y++ ){
        if (_.isUndefined(this.grid[y])){
          Vue.set(this.grid, y, []);
        }

        // constrain columns
        if ( this.grid[y].length > this.gridColumns ){
          Vue.set(this.grid, y, _.slice(this.grid[y], 0, this.gridColumns));
        }

        for( var x=0; x < this.gridColumns; x++ ){
          if (_.isUndefined(this.grid[y][x])){
            Vue.set(this.grid[y], x, this.backgroundEmoji);
          }
        }
      }
    },

    /**
     * Copy to clipboard
     */
    copyToClipboard: function(){
      let $target = document.querySelector('#canvas-copy');
      let output = '';
      for( let y=0; y < this.grid.length; y++){
        for( let x=0; x < this.grid[y].length; x++ ){
          output += this.grid[y][x].emoji;
        }
        output += this.linebreak;
      }

      $target.innerText = output;
      $target.select();

      document.execCommand('copy');
      this.flashNotification( Message('Copied to clipboard') );
    }
  }
});
