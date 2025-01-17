/* global $, Markdown, moment, Routing, WBDB */
import { data as Data } from "../wbdb.data.js";
import * as User from "../user.js";
import { enhanceTextarea, showBanner } from "../ui.js";
import { update as updateDeck } from "../deck.js";
import { update as updateCharts } from "../charts.js";
import { bbcode, markdown, plaintext, tts } from "../exporter.js";

export function enhanceDecklistPage({ commenters }) {
  Data.promise.then(function () {
    $(this).closest("tr").siblings().removeClass("active");
    $(this).closest("tr").addClass("active");
    for (var i = 0; i < WBDB.Decklist.cards.length; i++) {
      var slot = WBDB.Decklist.cards[i];
      Data.cards.updateById(slot.card_code, {
        indeck: parseInt(slot.qty, 10),
      });
    }
    updateDeck();
    updateCharts();
  });

  Promise.all([Data.promise, User.promise]).then(function () {
    if (User.data.moderation_status || User.data.is_moderator) {
      setup_moderation(
        User.data.moderation_status,
        User.data.moderation_reason,
        User.data.is_moderator
      );
    }
  });

  function setup_moderation(
    moderation_status,
    moderation_reason,
    is_moderator
  ) {
    switch (moderation_status) {
      case 0: // MODERATION_PUBLISHED
        break;
      case 1: // MODERATION_RESTORED
        showBanner(
          "This decklist has been restored to the public directories.",
          "info"
        );
        break;
      case 2: // MODERATION_TRASHED
        showBanner(
          "This decklist has been removed from the public directories. Reason: <b>" +
            moderation_reason +
            "</b>.",
          "danger"
        );
        break;
      case 3: // MODERATION_DELETED
        showBanner("This decklist has been deleted.", "warning");
        break;
    }

    if (!is_moderator) {
      return;
    }

    var $dropdown = $("#btn-group-decklist");
    $(
      '<li class="dropdown-header"><span class="glyphicon glyphicon-ban-circle"></span> Moderation</li>'
    ).appendTo($dropdown);
    $(
      '<li class="disabled"><a href="#" id="btn-moderation-trash">Trash</a></li>'
    ).appendTo($dropdown);
    $(
      '<li class="disabled"><a href="#" id="btn-moderation-absolve">Absolve</a></li>'
    ).appendTo($dropdown);
    $(
      '<li class="disabled"><a href="#" id="btn-moderation-delete">Delete</a></li>'
    ).appendTo($dropdown);

    switch (moderation_status) {
      case 0: // MODERATION_PUBLISHED
        $("#btn-moderation-trash").parent().removeClass("disabled");
        break;
      case 1: // MODERATION_RESTORED
        $(
          "#btn-moderation-trash,#btn-moderation-absolve,#btn-moderation-delete"
        )
          .parent()
          .removeClass("disabled");
        break;
      case 2: // MODERATION_TRASHED
        $("#btn-moderation-restore,#btn-moderation-absolve")
          .parent()
          .removeClass("disabled");
        break;
      case 3: // MODERATION_DELETED
        $("#btn-moderation-restore").parent().removeClass("disabled");
        break;
    }
  }

  function setup_comment_form() {
    var form = $(
      '<form method="POST" action="' +
        Routing.generate("decklist_comment") +
        '"><input type="hidden" name="uuid" value="' +
        WBDB.Decklist.uuid +
        '"><div class="form-group">' +
        '<textarea id="comment-form-text" class="form-control" maxlength="10000" rows="4" name="comment" placeholder="Enter your comment in Markdown format. Type # to enter a card name. Type $ to enter a symbol. Type @ to enter a user name."></textarea>' +
        '</div><div class="well text-muted" id="comment-form-preview"><small>Preview. Look <a href="http://daringfireball.net/projects/markdown/dingus">here</a> for a Markdown syntax reference.</small></div>' +
        '<div class="form-group small"><span class="help-block">By submitting content, you agree to the <a href="' +
        Routing.generate("cards_about") +
        '#code-of-conduct">Code of Conduct</a> of the website.</span></div>' +
        '<button type="submit" class="btn btn-success">Submit comment</button></form>'
    ).insertAfter("#comment-form");

    var already_submitted = false;
    form.on("submit", function (event) {
      event.preventDefault();
      var data = $(this).serialize();
      if (already_submitted) return;
      already_submitted = true;
      $.ajax(Routing.generate("decklist_comment"), {
        data: data,
        type: "POST",
        success: function () {
          form.replaceWith(
            '<div class="alert alert-success" role="alert">Your comment has been posted. It will appear on the site in a few minutes.</div>'
          );
        },
        error: function (jqXHR, textStatus, errorThrown) {
          console.log(
            "[" +
              moment().format("YYYY-MM-DD HH:mm:ss") +
              "] Error on " +
              this.url,
            textStatus,
            errorThrown
          );
          form.replaceWith(
            '<div class="alert alert-danger" role="alert">An error occured while posting your comment (' +
              jqXHR.statusText +
              "). Reload the page and try again.</div>"
          );
        },
      });
    });

    $("#social-icon-comment").on("click", function () {
      $("#comment-form-text").trigger("focus");
    });

    var converter = new Markdown.Converter();
    $("#comment-form-text").on("keyup", function () {
      $("#comment-form-preview").html(
        converter.makeHtml($("#comment-form-text").val())
      );
    });

    $("#comment-form-text").textcomplete([
      {
        match: /\B#([-+\w]*)$/,
        search: function (term, callback) {
          var regexp = new RegExp("\\b" + term, "i");
          var result = Data.cards.find({
            title: regexp,
          });
          callback(result);
        },
        template: function (value) {
          return value.title + " (" + value.pack.name + ")";
        },
        replace: function (value) {
          return (
            "[" +
            value.title +
            "](" +
            Routing.generate("cards_zoom", { card_code: value.code }) +
            ")"
          );
        },
        index: 1,
        idProperty: "code",
      },
      {
        match: /\B@([-+\w]*)$/,
        search: function (term, callback) {
          var regexp = new RegExp("^" + term);
          callback(
            $.grep(commenters, function (commenter) {
              return regexp.test(commenter);
            })
          );
        },
        template: function (value) {
          return value;
        },
        replace: function (value) {
          return "`@" + value + "`";
        },
        index: 1,
      },
      {
        match: /\$([-+\w]*)$/,
        search: function (term, callback) {
          var regexp = new RegExp("^" + term);
          callback(
            $.grep(
              ["mythium", "earth", "moon", "stars", "void", "historic"],
              function (symbol) {
                return regexp.test(symbol);
              }
            )
          );
        },
        template: function (value) {
          return value;
        },
        replace: function (value) {
          return (
            '<svg class="icon-wb icon-' +
            value +
            '"><use xlink:href="#icon-' +
            value +
            '"></use></svg>'
          );
        },
        index: 1,
      },
    ]);
  }

  function setup_social_icons() {
    var element;
    if (
      !User.data.is_authenticated ||
      User.data.is_author ||
      User.data.is_liked
    ) {
      element = $("#social-icon-like");
      element.replaceWith(
        $('<span class="social-icon-like"></span>').html(element.html())
      );
    }

    if (!User.data.is_authenticated) {
      element = $("#social-icon-favorite");
      element.replaceWith(
        $('<span class="social-icon-favorite"></span>').html(element.html())
      );
    } else if (User.data.is_favorite) {
      element = $("#social-icon-favorite");
      element.attr("title", "Remove from favorites");
    } else {
      element = $("#social-icon-favorite");
      element.attr("title", "Add to favorites");
    }

    if (!User.data.is_authenticated) {
      element = $("#social-icon-comment");
      element.replaceWith(
        $('<span class="social-icon-comment"></span>').html(element.html())
      );
    }
  }

  function setup_title() {
    var title = $("h1.decklist-name");
    if (User.data.is_author && User.data.can_delete) {
      title.prepend(
        '<a href="#" title="Delete decklist" id="decklist-delete"><span class="glyphicon glyphicon-trash pull-right text-danger"></span></a>'
      );
    }
    if (User.data.is_author) {
      title.prepend(
        '<a href="#" title="Edit decklist name / description" id="decklist-edit"><span class="glyphicon glyphicon-pencil pull-right"></span></a>'
      );
    }
  }

  function setup_comment_hide() {
    if (User.data.is_author || User.data.is_moderator) {
      $(".comment-hide-button").remove();
      $(
        '<a href="#" class="comment-hide-button"><span class="text-danger glyphicon glyphicon-remove" style="margin-left:.5em"></span></a>'
      )
        .appendTo(".collapse.in > .comment-date")
        .on("click", function () {
          if (
            confirm("Do you really want to hide this comment for everybody?")
          ) {
            hide_comment($(this).closest("td"));
          }
          return false;
        });
      $(
        '<a href="#" class="comment-hide-button"><span class="text-success glyphicon glyphicon-ok" style="margin-left:.5em"></span></a>'
      )
        .appendTo(".collapse:not(.in) > .comment-date")
        .on("click", function () {
          if (confirm("Do you really want to unhide this comment?")) {
            unhide_comment($(this).closest("td"));
          }
          return false;
        });
    }
  }

  function hide_comment(element) {
    var id = element.attr("id").replace(/comment-/, "");
    $.ajax(
      Routing.generate("decklist_comment_hide", { comment_id: id, hidden: 1 }),
      {
        type: "POST",
        dataType: "json",
        success: function (data) {
          if (data === true) {
            $(element).find(".collapse").collapse("hide");
            $(element)
              .find(".comment-toggler")
              .show()
              .prepend(
                "The comment will be hidden for everyone in a few minutes."
              );
            setTimeout(setup_comment_hide, 1000);
          } else {
            alert(data);
          }
        },
        error: function (jqXHR, textStatus, errorThrown) {
          console.log(
            "[" +
              moment().format("YYYY-MM-DD HH:mm:ss") +
              "] Error on " +
              this.url,
            textStatus,
            errorThrown
          );
          alert(
            "An error occured while hiding this comment (" +
              jqXHR.statusText +
              "). Reload the page and try again."
          );
        },
      }
    );
  }

  function unhide_comment(element) {
    var id = element.attr("id").replace(/comment-/, "");
    $.ajax(
      Routing.generate("decklist_comment_hide", { comment_id: id, hidden: 0 }),
      {
        type: "POST",
        dataType: "json",
        success: function (data) {
          if (data === true) {
            $(element).find(".collapse").collapse("show");
            $(element).find(".comment-toggler").hide();
            setTimeout(setup_comment_hide, 1000);
          } else {
            alert(data);
          }
        },
        error: function (jqXHR, textStatus, errorThrown) {
          console.log(
            "[" +
              moment().format("YYYY-MM-DD HH:mm:ss") +
              "] Error on " +
              this.url,
            textStatus,
            errorThrown
          );
          alert(
            "An error occured while unhiding this comment (" +
              jqXHR.statusText +
              "). Reload the page and try again."
          );
        },
      }
    );
  }

  function do_action_decklist() {
    var action_id = $(this).attr("id");
    if (!action_id || !WBDB.SelectedDeck) return;
    switch (action_id) {
      case "btn-download-text":
        location.href = Routing.generate("decklist_text_export", {
          decklist_uuid: WBDB.Decklist.uuid,
        });
        break;
    }
  }

  $(function () {
    $.when(User.deferred).then(function () {
      if (User.data.is_authenticated) {
        setup_comment_form();
        setup_title();
        setup_comment_hide();
      } else {
        $("<p>You must be logged in to post comments.</p>").insertAfter(
          "#comment-form"
        );
      }
      setup_social_icons();
    });

    $(document).on("click", "#decklist-edit", edit_form);
    $(document).on("click", "#decklist-delete", delete_form);
    $(document).on("click", "#social-icon-like", send_like);
    $(document).on("click", "#social-icon-favorite", send_favorite);
    $(document).on("click", "#btn-download-text", do_action_decklist);
    $(document).on("click", "#btn-export-tts", tts);
    $(document).on("click", "#btn-export-bbcode", bbcode);
    $(document).on("click", "#btn-export-markdown", markdown);
    $(document).on("click", "#btn-export-plaintext", plaintext);
    $(document).on("click", "#btn-compare", compare_form);
    $(document).on("click", "#btn-compare-submit", compare_submit);
    $(document).on("click", "#btn-copy-decklist", copy_decklist);
    $(document).on("click", "#btn-moderation-absolve", moderation_absolve);
    $(document).on("click", "#btn-moderation-trash", moderation_trash);
    $(document).on("click", "#btn-moderation-restore", moderation_restore);
    $(document).on("click", "#btn-moderation-delete", moderation_delete);

    $("div.collapse").each(function (index, element) {
      $(element).on("show.bs.collapse", function () {
        $(this)
          .closest("td")
          .find(".glyphicon-eye-open")
          .removeClass("glyphicon-eye-open")
          .addClass("glyphicon-eye-close");
      });
      $(element).on("hide.bs.collapse", function () {
        $(this)
          .closest("td")
          .find(".glyphicon-eye-close")
          .removeClass("glyphicon-eye-close")
          .addClass("glyphicon-eye-open");
      });
    });

    $("#btn-group-sort-deck").on(
      {
        click: function (event) {
          event.preventDefault();
          if (
            $(this)
              .attr("id")
              .match(/btn-sort-(\w+)/)
          ) {
            WBDB.DisplaySort = RegExp.$1;
            WBDB.DisplaySortSecondary = null;
            updateDeck();
          }
          if (
            $(this)
              .attr("id")
              .match(/btn-sort-(\w+)-(\w+)/)
          ) {
            WBDB.DisplaySort = RegExp.$1;
            WBDB.DisplaySortSecondary = RegExp.$2;
            updateDeck();
          }
        },
      },
      "a"
    );

    $("#open-lists a").on("click", function (event) {
      if ($("#open-lists a").text() == "(show more)") {
        $("#open-lists a").text("(show less)");
        $(".other-list").show();
      } else {
        $("#open-lists a").text("(show more)");
        $(".other-list").hide();
      }
      event.preventDefault();
    });
  });

  function copy_decklist() {
    $.ajax(
      Routing.generate("deck_copy", { decklist_uuid: WBDB.Decklist.uuid }),
      {
        type: "POST",
        success: function () {
          alert("Decklist copied");
        },
        error: function (jqXHR, textStatus, errorThrown) {
          console.log(
            "[" +
              moment().format("YYYY-MM-DD HH:mm:ss") +
              "] Error on " +
              this.url,
            textStatus,
            errorThrown
          );
          alert(
            "An error occured while copying this decklist (" +
              jqXHR.statusText +
              "). Reload the page and try again."
          );
        },
      }
    );
  }

  function compare_submit() {
    var input = $("#decklist2_url").val();
    var uuid = null;
    var match = input.match("/decklist/(.*?)(/.*)*$");
    if (match) {
      uuid = match[1];
    } else if (
      input.match(
        "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"
      )
    ) {
      uuid = input;
    }
    if (uuid) {
      location.href = Routing.generate("decklists_diff", {
        decklist1_uuid: WBDB.Decklist.uuid,
        decklist2_uuid: uuid,
      });
    }
  }

  function compare_form() {
    $("#compareModal").modal("show");
    setTimeout(function () {
      $("#decklist2_url").focus();
    }, 1000);
  }

  function edit_form() {
    $("#publishModal").modal("show");

    var converter = new Markdown.Converter();
    $("#publish-decklist-description-preview").html(
      converter.makeHtml($("#publish-decklist-description").val())
    );
    $("#publish-decklist-description").on("keyup", function () {
      $("#publish-decklist-description-preview").html(
        converter.makeHtml($("#publish-decklist-description").val())
      );
    });

    enhanceTextarea("#publish-decklist-description");
  }

  function delete_form() {
    $("#deleteModal").modal("show");
  }

  function send_like() {
    var obj = $(this);
    $.post(
      Routing.generate("decklist_like"),
      {
        uuid: WBDB.Decklist.uuid,
      },
      function (data) {
        obj.find(".num").text(data);
      }
    );
  }

  function send_favorite() {
    var obj = $(this);
    $.post(
      Routing.generate("decklist_favorite"),
      {
        uuid: WBDB.Decklist.uuid,
      },
      function (data) {
        obj.find(".num").text(data);
        var title = obj.data("original-tooltip");
        obj.data(
          "original-tooltip",
          title === "Add to favorites"
            ? "Remove from favorites"
            : "Add to favorites"
        );
        obj.attr("title", obj.data("original-tooltip"));
      }
    );

    send_like.call($("#social-icon-like"));
  }

  function moderation_absolve() {
    if ($(this).parent().hasClass("disabled")) {
      return;
    }
    change_moderation_status(0);
  }

  function moderation_restore() {
    if ($(this).parent().hasClass("disabled")) {
      return;
    }
    change_moderation_status(1);
  }

  function moderation_trash() {
    if ($(this).parent().hasClass("disabled")) {
      return;
    }
    ask_modflag().then(function (modflag_id) {
      change_moderation_status(2, modflag_id);
    });
  }

  function moderation_delete() {
    if ($(this).parent().hasClass("disabled")) {
      return;
    }
    change_moderation_status(3);
  }

  function ask_modflag() {
    return get_modflags().then(show_modflag_modal);
  }

  function get_modflags() {
    return new Promise(function (resolve) {
      var url = Routing.generate("modflags_get");
      $.get(url).then(function (response) {
        resolve(response.data);
      });
    });
  }

  function show_modflag_modal(data) {
    return new Promise(function (resolve) {
      var $modal = $("#moderationModal");
      var $list = $("#moderation-reason");
      data.forEach(function (modflag) {
        $list.append(
          $(
            '<option value="' + modflag.id + '">' + modflag.reason + "</option>"
          )
        );
      });
      var $button = $("#btn-moderation-submit");
      $button.click(function () {
        $modal.modal("hide");
        resolve($list.val());
      });
      $modal.modal("show");
    });
  }

  function change_moderation_status(status, modflag_id) {
    var url = Routing.generate("decklist_moderate", {
      decklist_uuid: WBDB.Decklist.uuid,
      status: status,
      modflag_id: modflag_id,
    });
    $.post(url).then(function () {
      if (status !== 3) {
        location.reload();
      } else {
        location = Routing.generate("decklists_list");
      }
    });
  }
}
