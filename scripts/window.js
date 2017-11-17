// Run this function after the page has loaded
$(() => {
  const path = require('path');
  const fs = require('fs');



  /********************************************
  *
  *       CORE FUNCTIONS
  *
  ********************************************/



  /*  Load the content of an eula.

      PARAMS
        path (string)

      RETURN
        none
  */
  const loadEula = (path) => {

    let content = fs.readFileSync(path, { encoding: 'utf8' });

    let contentSplit = content.split('\n');
    let htmlElement = '';
    contentSplit.forEach(c => {
      htmlElement += `<p class="eula-paragraph">${c}</p>`;
    });

    $('#preview-content').empty();
    $('#preview-content').append(htmlElement);
  };

  /*  List EULAs from eulas folder.

      PARAMS
        none

      RETURN
        none
  */
  const listEulas = () => {

    let child_process = require('child_process');

    let eulasFolder = path.join(__dirname, 'eulas');
    let process = child_process.spawn('ls', [ eulasFolder ]);

    let stdout = '';
    process.stdout.on('data', data => {

      stdout += data.toString();
    });

    process.stderr.on('data', data => {

      console.log(data.toString());
    });

    process.on('close', () => {

      let eulas = [ ];
      let files = stdout.split('\n');

      files.forEach(f => {

        if (!f) return;
        let name = f.substr(0, f.length - 4).replace(/_/g, ' ');

        let eula = {
          name: name,
          path: path.join(__dirname, 'eulas', f)
        };

        eulas.push(eula);
      });

      eulas.forEach((eula, i) => {
        let htmlElement = `<option value="${eula.path}"> ${eula.name} </option>`;

        $('#select-eulas').append(htmlElement);
      });

      if (eulas) loadEula(eulas[0].path);
    });
  };

  /*  List queries in sidebar.

      PARAMS
        queries (array of objects): see queries.js

      RETURN
        none
  */
  const listQueries = queries => {
      queries.forEach((query, i) => {

      let htmlElement = `
        <div class="checkbox query-${i}">
          <input type="checkbox" id="query-${i}" value="${i}">
          <label for="query-${i}"> ${query} </label>
        </div>
      `;
      $('#sidebar').append(htmlElement);
    });
  }

  /*  Get the list of selected queries.

      PARAMS
        queries: see queries.js

      RETURN
        selectedQueries (array of objects)
          text (string)
          style (string): style class
  */
  const getSelectedQueries = queries => {

      let checkboxes = $('input[type="checkbox"]');

      let selectedQueries = [ ];
      for (let i = 0 ; i < checkboxes.length ; i++) {
        let c = $(checkboxes[i]);
        if (c.prop('checked')) {
          let id = c.val();

          let query = {
            text: queries[id],
            style: `query-${id}`
          };

          selectedQueries.push(query);
        }
      }

      return selectedQueries;
  }

  /*  Display the results of the analysis.

      PARAMS
        results (array of objects): information on paragraphs
          text (string)
          weight (float)
        query (object): see return of getSelectedQueries

      RETURN
        none
  */
  const displayResults = (results, query) => {

    let bestResult = results[0];
    // if (bestResult.weight < 0.3) return;

    let ps = $('#preview-content p');

    for (let i = 0 ; i < ps.length ; i++) {
      pElement = $(ps[i]);

      if (pElement.text() === bestResult.text) {
        pElement.addClass(query.style);

        let tooltip = `<div class="tooltip"> query: ${query.text} <br> confidence: ${bestResult.weight} </div>`;

        pElement.append(tooltip);
      }
    };
  }

  /*  Fetch information in an EULA.

      PARAMS
        query (object): see return of getSelectedQueries

      RETURN
        none
  */
  const analyzeEula = (query) => {

    let child_process = require('child_process');

    let scriptPath = path.join(__dirname, 'scripts', 'IR_better.py');
    let process = child_process.spawn('python', [ scriptPath, $('#select-eulas').val(), query.text ]);

    let stdout = '';
    process.stdout.on('data', data => {

      stdout += data.toString();
    });

    process.stderr.on('data', data => {

      console.log(data.toString());
    });

    process.on('close', () => {

      let paragraphs = [ ];
      let paragraphsInfo = stdout.split('\n');

      paragraphsInfo.forEach(p => {

        infoStr = p.split('|');
        if (!infoStr[0]) return;

        let info = {
          text: infoStr[0],
          weight: parseFloat(infoStr[1])
        };

        paragraphs.push(info);
      });

      displayResults(paragraphs, query);
    });
  };



  /********************************************
  *
  *       TEMPLATE EVENTS
  *
  ********************************************/



  /*  Handle the selection of an eula.

      PARAMS
        none

      RETURN
        none
  */
  const onEulaSelected = () => {

    loadEula($('#select-eulas').val());
  };

  /*  Handle click on analyze button.

      PARAMS
        queries: see queries.js

      RETURN
        none
  */
  const onAnalyze = queries => {

    let eula = $('#select-eulas').val();
    if (eula === null) return;

    let selectedQueries = getSelectedQueries(queries);
    if (!selectedQueries) return;

    selectedQueries.forEach(q => {
      analyzeEula(q);
    });
  };



  /********************************************
  *
  *       SCRIPT
  *
  ********************************************/



  let queries = require(path.join(__dirname, 'scripts', 'queries'));

  // handle change of select tag
  $('#select-eulas').change(onEulaSelected);

  // list eulas in select tag
  listEulas();

  // create queries in sidebar
  listQueries(queries);

  // handle change of select tag
  $('#action-analyze').click(() => onAnalyze(queries));
});
