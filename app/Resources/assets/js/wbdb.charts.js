/* global Chart, WBDB */
export const charts = {};

let instances = null;

charts.update = function () {
  if (instances === null) {
    instances = create_charts();
  }

  if (instances.cost) {
    var costData = repartitionByCost();
    instances.cost.data = costData;
    instances.cost.update();
  }

  if (instances.cardCount) {
    var cardCountData = cardCountGraphData();
    instances.cardCount.data = cardCountData;
    instances.cardCount.update();
  }
};

function create_charts() {
  var charts = {};

  if (document.getElementById("costChart")) {
    charts.cost = make_stacked_bar_chart(document.getElementById("costChart"), {
      labels: [],
      datasets: [],
    });
  }

  if (document.getElementById("cardCountChart")) {
    charts.cardCount = makeCardCountGraph(
      document.getElementById("cardCountChart")
    );
  }

  return charts;
}

function repartitionByCost() {
  var costData = {};

  var minCost = 0;
  var maxCost = 0;
  var cards = WBDB.data.cards.find({
    indeck: { $gt: 0 },
    type_code: { $ne: "identity" },
  });

  cards.forEach(function (card) {
    if (card.cost > maxCost) {
      maxCost = card.cost;
    }
  });

  cards.forEach(function (card) {
    if (card.cost != null) {
      if (!(card.type.code in costData)) {
        costData[card.type.code] = new Array(maxCost - minCost + 1).fill(0);
      }
      costData[card.type.code][card.cost] += card.indeck;
    }
  });

  var types = WBDB.data.types.find({ code: { $ne: "identity" } });
  var types_colors = {
    event: "red",
    follower: "blue",
    location: "green",
  };

  var labels = [];
  for (var i = minCost; i <= maxCost; ++i) {
    labels.push(i);
  }

  var data = {
    labels: labels,
    datasets: types.map(function (type) {
      return {
        label: type.name,
        // TODO: Set colors in JSON
        backgroundColor: types_colors[type.code],
        data: costData[type.code],
      };
    }),
  };

  return data;
}

function make_stacked_bar_chart(element, data) {
  var config = {
    type: "bar",
    data: data,
    options: {
      aspectRatio: 1,
      plugins: {
        legend: {
          align: "start",
          position: "bottom",
        },
      },
      responsive: true,
      scales: {
        x: {
          stacked: true,
        },
        y: {
          stacked: true,
        },
      },
    },
  };

  return new Chart(element, config);
}

var COLORS = {
  earth: ["#C98161", "#D8A48D", "#E7C8BA"],
  moon: ["#476A89", "#557FA4", "#6F94B4"],
  stars: ["#ABA58B", "#C5C1AF", "#DFDDD3"],
  void: ["#48375B", "#56426D", "#654D7F"],
  neutral: ["#AAAAAA", "#AAAAAA", "#AAAAAA"],
};

function cardCountGraphData() {
  var cards = WBDB.data.cards.find({
    indeck: { $gt: 0 },
    type_code: { $ne: "identity" },
  });

  var guilds = WBDB.data.factions.find(
    { code: { $ne: "neutral" } },
    { $orderBy: { name: 1 } }
  );
  guilds.push(WBDB.data.factions.find({ code: { $eq: "neutral" } })[0]);
  var guildCodes = guilds.map(function (guild) {
    return guild.code;
  });
  var labels = guilds.map(function (guild) {
    return guild.name;
  });

  var data = [];
  for (var i = 0; i < 3; i++) {
    data.push(new Array(guilds.length).fill(0));
  }

  cards.forEach(function (card) {
    if (card.standing_req > 0) {
      Object.entries(card.standing).forEach(function (entry) {
        var guildCode = entry[0];
        var standingReq = entry[1];
        var guildIndex = guildCodes.indexOf(guildCode);
        data[standingReq - 1][guildIndex]++;
      });
    } else {
      data[0][guildCodes.length - 1]++;
    }
  });

  var datasets = [
    {
      label: "One standing of this guild",
      data: data[0],
      backgroundColor: createBackgroundColors(2),
    },
    {
      label: "Two standing of this guild",
      data: data[1],
      backgroundColor: createBackgroundColors(1),
    },
    {
      label: "Three standing of this guild",
      data: data[2],
      backgroundColor: createBackgroundColors(0),
    },
  ];

  return {
    labels: labels,
    datasets: datasets,
  };

  function createBackgroundColors(index) {
    return guildCodes.map(function (guild) {
      return COLORS[guild][index];
    });
  }
}

function makeCardCountGraph(element) {
  const config = {
    type: "bar",
    data: { labels: [], datasets: [] },
    options: {
      aspectRatio: 1,
      plugins: {
        legend: {
          display: false,
        },
      },
      responsive: true,
      interaction: {
        intersect: false,
      },
      scales: {
        x: {
          stacked: true,
        },
        y: {
          stacked: true,
        },
      },
    },
  };

  return new Chart(element, config);
}
