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

    $('#preview-content').empty();

		let content = fs.readFileSync(path, { encoding: 'utf8' });
		let contentSplit = content.split('\n');

    let i = 0;
    let p = '';
    while(i < contentSplit.length) {

      let l = contentSplit[i];

			if (l !== '') {
				p += `<span>${l}</span>&nbsp;`
			} else {

				let htmlElement;

				if (p !== '') {
					htmlElement = `<p>${p}</p>`;
					$('#preview-content').append(htmlElement);
					p = '';
				}

				htmlElement = `<p><span> </span></p>`;
				$('#preview-content').append(htmlElement);
			}

      i++;
    };
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
          id (string)
          weight (float)
        query (object): see return of getSelectedQueries

      RETURN
        none
  */
  const displayResults = (results, query) => {

    if (results.length === 0) {
      console.log('no result found');
      return;
    }

		let els = $('#preview-content span');

    let bestResults = results.filter(r => r.weight >= 0.3);
		bestResults.forEach(r => {
	    let el = $(els[r.id]);

			el.addClass('eula-paragraph');
			el.addClass(query.style);

			let tooltip = `<div class="tooltip"> query: ${query.text} <br> confidence: ${r.weight} </div>`;

			el.append(tooltip);
		});
  }

  /*  Fetch information in an EULA.

      PARAMS
        query (object): see return of getSelectedQueries

      RETURN
        none
  */
  const analyzeEula = (query) => {

    let child_process = require('child_process');

    let scriptPath = path.join(__dirname, 'scripts', 'IR_better_v2.py');
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
          id: infoStr[0],
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

    // clean previous analysis
    $('.tooltip').remove();
    $('#preview-content span').removeClass((i, className) => className);

    // perform analysis
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
