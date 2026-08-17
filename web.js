/* ==========================================================================
   PostSafe Web — den Code in eine Adresse übersetzen.

   Diese Seite holt keine Daten vom iPhone. Sie darf es auch gar nicht: eine
   HTTPS-Seite kommt an eine Adresse im heimischen Netz nicht heran. Was sie
   darf, ist den Browser dorthin schicken — eine Weiterleitung ist erlaubt,
   ein Datenabruf wäre es nicht. Das ist der ganze Trick.

   Der Code ist deshalb kein Geheimnis, sondern die Adresse selbst: eine
   Ziffer sagt, in welchem Netz das iPhone steckt, drei sagen, welches Gerät
   darin. Wer hereindarf, entscheidet das iPhone anschliessend selbst — dort
   erscheint die Frage, und erst ein Fingertipp öffnet das Archiv.

   Die Liste unten steht wortgleich in der App (WebAddressCode.networks).
   Nichts darin darf verschoben oder entfernt werden: ein Eintrag, der seinen
   Platz wechselt, schickt jeden bereits vergebenen Code ein Netz zur Seite.
   ========================================================================== */

(function () {
  'use strict';

  var NETZE = [
    '192.168.178',
    '192.168.1',
    '192.168.2',
    '192.168.0',
    '192.168.100',
    '192.168.188',
    '192.168.10',
    '10.0.0',
    '10.0.1',
    '172.20.10'
  ];
  var PORT = 8724;

  /* Vier Ziffern zu einer Adresse, oder null. */
  function adresse(code) {
    if (!/^[0-9]{4}$/.test(code)) { return null; }
    var netz = NETZE[parseInt(code.charAt(0), 10)];
    var geraet = parseInt(code.slice(1), 10);
    if (!netz || geraet < 1 || geraet > 254) { return null; }
    return netz + '.' + geraet;
  }

  var formular = document.getElementById('verbinden');
  if (!formular) { return; }

  var feld = document.getElementById('code');
  var hinweis = document.getElementById('pair-hinweis');

  /* Nur Ziffern, und höchstens vier. Ein Feld, das Buchstaben annimmt und
     danach meckert, ist eine Falle statt einer Hilfe. */
  feld.addEventListener('input', function () {
    var sauber = feld.value.replace(/[^0-9]/g, '').slice(0, 4);
    if (sauber !== feld.value) { feld.value = sauber; }
    hinweis.textContent = '';
  });

  formular.addEventListener('submit', function (ereignis) {
    ereignis.preventDefault();

    var ziel = adresse(feld.value);
    if (!ziel) {
      hinweis.textContent = feld.value.length === 4
        ? 'Diesen Code gibt es nicht. Sieh am iPhone noch einmal nach.'
        : 'Der Code hat vier Ziffern.';
      feld.focus();
      return;
    }

    hinweis.textContent = 'Verbinde mit deinem iPhone …';
    /* replace statt href: kommt jemand mit „Zurück“ hierher, soll er wieder
       den Code eingeben und nicht auf einer toten Adresse landen. */
    window.location.replace('http://' + ziel + ':' + PORT + '/');
  });
})();
