var backgroundEmoji = {};
var currentEmoji = {};
var palette = [];
var rows = 10;
var columns = 12;
var grid = [];
var linebreak = "\n";
var emojiSelector = '.twemoji';

var emojiRepo = {
  library: [],
  byCategory: {},
  backgrounds: [],
  background_search_strings: ['tree', 'square', 'skin'],

  get: function(name){
    return _.find(emojiRepo.library, { name: name });
  },

  /**
   * Remove the crud from single-character emojis
   */
  cleanEmoji: function(string){
    if (Array.from(string).length <= 2){
      string = string.replace(/[\u200B-\u200D\uFEFF\uFE0F]/g, '');
    }
    return string;
  },

  /**
   * Process emoji data to make future operations easier
   */
  process: function(){

    for(var i=0; i < this.library.length; i++ ){
      var emoji = this.library[i];

      // provide a singular name
      emoji.name = this.library[i].aliases[0];
      emoji.emoji = this.cleanEmoji( emoji.emoji );

      // tag backgrounds
      for( var j=0; j < this.background_search_strings.length; j++) {
        if (emoji.name.indexOf(this.background_search_strings[j]) !== -1){
          emojiRepo.backgrounds.push(emoji);
        }
      }

      // filter out those missing data
      if ( !_.isUndefined(emoji.emoji) ){
        if ( _.isUndefined(this.byCategory[emoji.category]) ) {
          this.byCategory[emoji.category] = [];
        }
        this.byCategory[emoji.category].push(emoji);
      }

      this.library[i] = emoji;
    }
  }
};

var template = {
  templates: {
    'default': '<span class="twemoji e-{:name} {:classes}" data-name="{:name}" title="{:name}">{:emoji}</span>',
    'grid': '<span class="twemoji e-{:name} {:classes}" data-name="{:name}" data-x="{:x}" data-y="{:y}" title="({:x},{:y})">{:emoji}</span>',
    'selectOption': '<option value="{:name}">{:emoji} - {:name}</option>',
  },
  render: function( template, replacements = { name: '', emoji: '', classes: '', x: '', y: '' }){
    var output = this.templates[template];

    _.forEach(replacements, function(value, key){
      output = output.replace(new RegExp('{:'+key+'}','g'), value);
    });

    return output;
  }
};

var $library = $('#library');
var $canvas = $('#canvas');
var $palette = $('#palette');
var $currentEmoji = $('#currentEmoji');
var $backgroundEmoji = $('#backgroundEmoji');

(function($, _){

  $(document).ready(init);

  function init(){
    emojiRepo.process();

    setCurrentEmoji('deciduous_tree');
    makeBackgroundSelectOptions();
    setBackgroundEmoji('white_large_square');
    makeStartingGrid();
    drawGrid();
    fillLibrary();
    libraryControls();
    canvasControls();
    paletteControls();
    backgroundControls();
    copyToClipboardControls();
  }

  function setCurrentEmoji(name){
    currentEmoji = emojiRepo.get(name);
    $currentEmoji.html( template.render('default', { name: currentEmoji.name, emoji: currentEmoji.emoji } ) );
  }

  function setBackgroundEmoji(name){
    backgroundEmoji = emojiRepo.get(name);
    $backgroundEmoji.val( backgroundEmoji.name );
  }

  function makeBackgroundSelectOptions(){
    for( var i=0; i < emojiRepo.backgrounds.length; i++ ){
      $backgroundEmoji.append( template.render('selectOption', {
        name: emojiRepo.backgrounds[i].name,
        emoji: emojiRepo.backgrounds[i].emoji
      }));
    }
  }

  /**
   * Control the mass-changing of the background
   */
  function backgroundControls(){
    $backgroundEmoji.change(function(){
      setBackgroundEmoji($(this).val());
      backgroundUpdate();
    });
  }

  /**
   * Update the grid when background is changed
   */
  function backgroundUpdate(){
    $('.background-item', $canvas).each(function(index, item){
      var $item = $(item);

      $item.replaceWith( template.render('grid', {
        name: backgroundEmoji.name,
        emoji: backgroundEmoji.emoji,
        classes: 'background-item',
        x: $item.data('x'),
        y: $item.data('y')
      }));

    });
  }

  /**
   * Select an emoji from the library and add it to the palette
   */
  function libraryControls(){
    $library.on('click', emojiSelector, function(){
      var $item = $(this);
      setCurrentEmoji($item.data('name'));

      // if not in palette already
      if ( $palette.find( '.e-' +$item.data('name') ).length === 0 ){
        $palette.append( template.render('grid', {
          name: currentEmoji.name,
          emoji: currentEmoji.emoji,
          classes: 'grid-item',
          x: $item.data('x'),
          y: $item.data('y')
        }));
      }
    });
  }

  /**
   * Select an emoji from the palette
   */
  function paletteControls(){
    $palette.on('click', emojiSelector, function(){
      setCurrentEmoji( $(this).data('name') );
    });
  }

  /**
   * Paint an emoji to the canvas
   */
  function canvasControls(){
    $canvas.on('click', emojiSelector, function(){
      var $item = $(this);
      $item.replaceWith(template.render('grid', {
        name: currentEmoji.name,
        emoji: currentEmoji.emoji,
        classes: 'grid-item',
        x: $item.data('x'),
        y: $item.data('y')
      }));
    });
  }

  /**
   * Copy to clipboard
   */
  function copyToClipboardControls(){
    var $copyBtn = $('#canvas-copy-button');

    $copyBtn.click(function(event) {
      var text = $('#canvas').text().trim();
      $('#canvas-copy').val( text ).select();
      document.execCommand('copy');
    });
  }

  /**
   * Library emoji selection box
   */
  function fillLibrary(){
    _.forEach(emojiRepo.byCategory, function(emojis, category){
      console.log(category);
      $library.append('<h4>'+category+'</h4>');

      _.forEach(emojis, function(emoji, i){
        $library.append( template.render('default', {
          name: emoji.name,
          emoji: emoji.emoji,
          classes: 'library-item'
        }));

        if (i % columns === 0){
          $library.append(linebreak);
        }
      });
    });
  }

  /**
   * Starting grid
   */
  function makeStartingGrid(){
    for( var y=0; y < rows; y++ ){
      grid.push([]);
      for( var x=0; x < columns; x++ ){
        grid[y][x] = template.render('grid', {
          name: backgroundEmoji.name,
          emoji: backgroundEmoji.emoji,
          classes: 'background-item',
          x: x,
          y: y
        });
      }
    }
  }

  /**
   * Draw the grid
   */
  function drawGrid(){
    for( var y=0; y < rows; y++ ){
      for( var x=0; x < columns; x++ ){
        $canvas.append(grid[y][x]);
      }
      $canvas.append(linebreak);
    }
  }

})(jQuery, _);