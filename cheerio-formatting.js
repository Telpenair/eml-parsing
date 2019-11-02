const fs = require('fs');
const cheerio = require('cheerio')
const prettier = require('prettier')
const cyrillicToTranslit = require('cyrillic-to-translit-js')

const html = fs.readFileSync("./unpack_output/index.html", "utf-8");

const $ = cheerio.load(html, { decodeEntities: false });

// extend cheerio with return name function
$.prototype.getTagName = function() {
  return this[0]['name'];
};

// нужно обойти все span
// и по if сделать проверку
// если li то пилим одну штуку
// если p то другую
// в итоге их нужно обернуть, накидать классов, вот это вот всё

$('*').each(function() {
  let $this = $(this);

  // удаляем все лишние аттрибуты
  let attributes =  $this.attr();
  for (let attribute in attributes){
    $this.removeAttr(attribute);
  }

  // удалить пустые блоки
  if ($this.text().trim() === ''){
    $this.remove();
  }
});

let $temporaryContainer = $('<div></div>');

$('p, ol').each(function() {
	let $this = $( this );
  $temporaryContainer.append($this);
});

// 1. Находим все ul, и для каждого из них:
$temporaryContainer.find('ol').each(function() {
  const $this = $( this );
    // 1.2. Создаем пустой массив arr для элементов представляющих li (которые начинаются с тире),
    let $elements_to_be_turned_into_li = [];

  // 2. Для всех следующих после него элементов (их ищем с помощью next):
  $this.nextUntil('ol').each(function() {
    // 3. Если текущий элемент начинается с "-", то добавляем его в arr, если нет то выходим из цикла,
    const $this = $(this);
    if ($this.text().trim()[0] === '-' ){
      $elements_to_be_turned_into_li.push($this);
      $this.remove();
    } else { return; }
    // текст берем с помощью $( this ).text()
    // добавляем в массив с помощью $elements_to_be_turned_into_li = $elements_to_be_turned_into_li.add( $(this) )
    // выходим с помощью return
  });

  // 4. Обрабатываем получившийся массив с помощью описанного выше алгоритма

  // 1. Создаем временный ol,
  const $ul = $('<ul></ul>');

  $elements_to_be_turned_into_li.forEach(function(el) {
    // 2. Кладём в него текст из элементов, попутно удаляя сами элементы,
    // кладём с помощью $ol.append( $element )
    // удаляем с помощью $element.remove()
    $ul.append(`<li>${$(el).text().split('-')[1].trim()}</li>`);
    // 3. Кладёт этот временный ol после исходного ul 
    // кладём с помощью $this.after( $ol )
  });
  $this.find('span').after($ul);

});

$temporaryContainer.find('*:empty').each(function(){
  $(this).remove();
})

///////////////////////////////////////////////
// Здесь мы делаем заголовок статьи для slug и помещаем в json

const $mainHeader = $temporaryContainer.find('font')
// TO DO
// отправляем в json заголовок статьи

let translitHeader = cyrillicToTranslit().transform( $mainHeader.text() ).trim().toLowerCase();
translitHeader = translitHeader.split(/\s+/g).join('-');
console.log(translitHeader);

$mainHeader.parent().remove();

//////////////////////////////////////////////

$temporaryContainer.find('b').each(function(){

  const $this = $(this);
  $this.parent().replaceWith(`<h2>${$this.text()}</h2>`);

});

let $section = $('<section></section>');
let $sectionContainer = $('<div></div>');

$temporaryContainer.children().each(function(){
  let $this = $(this);
  
  if ($this[0]['name'] === 'h2' && $this.prev().length){
    console.log('bip');
    $sectionContainer.append($section);
    $section = $('<section></section>');
  }
  $section.append($this);

  if (!$this.next().length){
    $sectionContainer.append($section);
  }
})

$sectionContainer.find('span').each(function(){

  const $this = $(this);
  if(!($this.next().length && $this.next()[0]['name'] === 'ul')) {
    $this.replaceWith(`${$this.text()}`);
  }
  
});

$sectionContainer.find('ol, ul').each(function () {
  const $this = $(this);
  if ( $this.next().length && $this.getTagName() === $this.next().getTagName() ) {
    $this.append($this.next().children());
    $this.next().remove();
  }
});


fs.writeFileSync(`./${translitHeader}.html`, 
  prettier.format(
    $sectionContainer.html(), 
    { semi: false, parser: "html" }
  )
);
