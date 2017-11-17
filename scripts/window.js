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
      htmlElement += `<p>${c}</p>`;
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

  /*  Display the results of the analysis.

      PARAMS
        results (array of objects): information on paragraphs
          text (string)
          weight (float)

      RETURN
        none
  */
  const displayResults = results => {

    let bestResult = results[0];
    if (bestResult.weight < 0.3) return;

    let ps = $('#preview-content p');

    for (let i = 0 ; i < ps.length ; i++) {
      pElement = $(ps[i]);

      if (pElement.text() === bestResult.text) {
        pElement.addClass('search');
      }
    };
  }

  /*  Fetch information in an EULA.

      PARAMS
        query (string)

      RETURN
        none
  */
  const analyzeEula = (query) => {

    let child_process = require('child_process');

    let scriptPath = path.join(__dirname, 'scripts', 'IR_better.py');
    let process = child_process.spawn('python', [ scriptPath, $('#select-eulas').val(), query ]);

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

      displayResults(paragraphs);
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
        none

      RETURN
        none
  */
  const onAnalyze = () => {

    let eula = $('#select-eulas').val();
    if (eula === null) return;

    let queries = "What is the name of the software";

    analyzeEula(queries);
  };



  /********************************************
  *
  *       SCRIPT
  *
  ********************************************/



  let queries = [
    "What is the name of the software",
    "What is the name of the company",
    "Where is the headquarter of the company",
    "Who owns the software",
    "Who has the intellectual property of the software",
    "What are the terms of the license grant",
    "Is the product licensed or sold",
    "How long is the license",
    "How many downloads are authorized",
    "How long is the period of evaluation",
    "Is there a reverse engineering clause",
    "What are the restriction on use for users",
    "Is there any related agreements",
    "Is your application collecting personal information from users",
    "Is there a termination of licensing",
    "Is there a Maintenance Policies",
    "What is the period of warranty",
    "What is the disclaimer of warranty",
    "Is it possible that the product will be updated regularly in the future",
    "For any material changes, what is the period of time that the company has to notice the user in advance",
    "Under the law of which jurisdiction this agreement is referring to ",
    "Is there a specific export information"
  ];

  // handle change of select tag
  $('#select-eulas').change(onEulaSelected);

  // list eulas in select tag
  listEulas();

  // create queries in sidebar
  queries.forEach((query, i) => {

    let htmlElement = `
      <div class="checkbox">
        <input type="checkbox" id="query-${i}" value="${i}">
        <label for="query-${i}"> ${query} </label>
      </div>
    `;
    $('#sidebar').append(htmlElement);
  });

  // handle change of select tag
  $('#action-analyze').click(onAnalyze);
});
