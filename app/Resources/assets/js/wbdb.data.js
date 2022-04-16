/* global _, $, ForerunnerDB, Routing, WBDB */
import { showBanner } from "./ui.js";

var force_update = false;
var fdb = new ForerunnerDB();
var dbNames = ["packs", "cards", "factions", "types"];

export const data = {
  promise: new Promise(function (resolve) {
    $(document).on("data.app", resolve);
  }),
  db: fdb.db("netrunnerdb"),
  masters: {},

  find_identity() {
    return data.cards
      .find({ indeck: { $gt: 0 }, type_code: "identity" })
      .pop();
  },
};

/**
 * loads the database from local
 * sets up a Promise on all data loading/updating
 * @memberOf data
 */
data.load = function load() {
  Promise.all(
    _.map(dbNames, function (dbName) {
      data.masters[dbName] = data.db.collection("master_" + dbName, {
        primaryKey: "code",
        changeTimestamp: true,
      });
      return fdb_load(data.masters[dbName]);
    })
  )
    .then(function (collections) {
      return Promise.all(
        _.map(collections, function (collection) {
          var age_of_database =
            new Date() - new Date(collection.metaData().lastChange);
          if (age_of_database > 864000000) {
            console.log("database is older than 10 days => refresh it");
            collection.setData([]);
            return false;
          }
          if (collection.count() === 0) {
            console.log("database is empty => load it");
            return false;
          }
          return true;
        })
      );
    })
    .then(
      function (collectionsInOrder) {
        console.log("all db successfully reloaded from storage");
        return _.every(collectionsInOrder);
      },
      function (message) {
        console.log("error when reloading db", message);
        return false;
      }
    )
    .then(function (allCollectionsInOrder) {
      force_update = !allCollectionsInOrder;
      if (!force_update) {
        data.release();
      }
    })
    .then(function () {
      return Promise.all(_.map(dbNames, loadDatabase));
    })
    .then(
      function (collectionsUpdated) {
        if (force_update) {
          data.release();
          return;
        }

        if (_.find(collectionsUpdated)) {
          showBanner(
            'A new version of the data is available. Click <a href="javascript:window.location.reload(true)">here</a> to reload your page.'
          );
        }
      },
      function (dataLoaded) {
        if (!_.every(dataLoaded)) {
          showBanner(
            'Unable to load the data. Click <a href="javascript:window.location.reload(true)">here</a> to reload your page.'
          );
        } else {
          data.release();
        }
      }
    );
};

/**
 * release the data for consumption by other modules
 * @memberOf data
 */
data.release = function release() {
  _.each(dbNames, function (dbName) {
    data[dbName] = data.db.collection(dbName, {
      primaryKey: "code",
      changeTimestamp: false,
    });
    data[dbName].setData(data.masters[dbName].find());
  });

  _.each(data.types.find(), function (type) {
    data.types.updateById(type.code, {});
  });

  _.each(data.factions.find(), function (faction) {
    data.factions.updateById(faction.code, {});
  });

  var imageUrlTemplate = WBDB.card_image_url + "/{size}/{code}{side}.jpg";
  var image = function (card, size, side) {
    return imageUrlTemplate
      .replace(/{size}/, size)
      .replace(/{code}/, card.code)
      .replace(/{side}/, side);
  };
  var images = function (card, size) {
    if (card.type_code === "identity") {
      return [image(card, size, "_front"), image(card, size, "_back")];
    }

    return [image(card, size, ""), null];
  };

  _.each(data.cards.find(), function (card) {
    data.cards.updateById(card.code, {
      faction: data.masters.factions.findById(card.faction_code),
      type: data.types.findById(card.type_code),
      pack: data.packs.findById(card.pack_code),
      images: {
        large: images(card, "large"),
        medium: images(card, "medium"),
        small: images(card, "small"),
        tiny: images(card, "tiny"),
      },
    });
  });

  data.isLoaded = true;

  $(document).trigger("data.app");
};

/**
 * triggers a forced update of the database
 * @memberOf data
 */
data.update = function update() {
  _.each(data.masters, function (collection) {
    collection.drop();
  });
  data.load();
};

/**
 * Promise interface to forerunnerdb's load method
 * @param db a Forerunner database
 */
function fdb_load(db) {
  return new Promise(function (resolve, reject) {
    db.load(function (err) {
      if (err) {
        reject(err);
      } else {
        resolve(db);
      }
    });
  });
}

function loadDatabase(dbName) {
  return new Promise(function (resolve, reject) {
    $.ajax(Routing.generate("api_public_" + dbName))
      .then(function (response, textStatus, jqXHR) {
        var lastModifiedData = new Date(
          jqXHR.getResponseHeader("Last-Modified")
        );
        var locale = jqXHR.getResponseHeader("Content-Language");
        var master = data.masters[dbName];
        var lastChangeDatabase = new Date(master.metaData().lastChange);
        var lastLocale = master.metaData().locale;
        var isCollectionUpdated = false;

        /*
         * if we decided to force the update,
         * or if the database is fresh,
         * or if the database is older than the data,
         * or if the locale has changed
         * then we update the database
         */
        if (
          force_update ||
          !lastChangeDatabase ||
          lastChangeDatabase < lastModifiedData ||
          locale !== lastLocale
        ) {
          console.log(
            dbName +
              " data is newer than database or update forced or locale has changed => update the database"
          );
          master.setData(response.data);
          master.metaData().locale = locale;
          isCollectionUpdated = locale === lastLocale;
        }

        master.save(function (err) {
          if (err) {
            console.log("error when saving " + dbName, err);
            reject(true);
          } else {
            resolve(isCollectionUpdated);
          }
        });
      })
      .catch(function (jqXHR, textStatus, errorThrown) {
        console.log(
          "error when requesting packs:" + dbName,
          errorThrown || jqXHR
        );
        reject(false);
      });
  });
}
