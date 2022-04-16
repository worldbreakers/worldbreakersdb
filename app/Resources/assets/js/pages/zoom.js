/* global $, Markdown, moment, Routing */
import { enhanceTextarea } from "../ui.js";
import * as user from "../user.js";

export function enhanceZoomPage() {
  $(function () {
    $(window.document).on("click", ".review-button", write_review_open);
    $(window.document).on("click", ".review-social-icon-like", like_review);
    $(window.document).on("click", ".btn-write-comment", write_comment);
    $(window.document).on("submit", "form.form-comment", form_comment_submit);
  });

  $.when(user.deferred).then(function () {
    if (user.data.is_authenticated) {
      if (user.data.review_id) {
        setup_edit();
      } else {
        setup_write();
      }
    }
    if (
      user.data.roles &&
      user.data.roles.indexOf("ROLE_GURU") > -1
    ) {
      // insert button to create ruling
      $(".rulings").append(
        '<a class="add-ruling" href="#addRulingModal" data-toggle="modal">Add a ruling</a>'
      );
      // add event listener for add ruling link
      $(window.document).on("click", ".add-ruling", add_ruling);
      // insert links to edit rulings
      $(".rulings-list li").append(
        '<a class="edit-ruling btn btn-default btn-xs" href="#editRulingModal" data-toggle="modal">Edit</a> '
      );
      // add event listener for edit ruling links
      $(window.document).on("click", ".edit-ruling", edit_ruling);
      // insert links to edit rulings
      $(".rulings-list li").append(
        '<a class="delete-ruling btn btn-danger btn-xs" href="#deleteRulingModal" data-toggle="modal">Delete</a> '
      );
      // add event listener for delete ruling links
      $(window.document).on("click", ".delete-ruling", delete_ruling);
    }
  });

  function add_ruling() {
    var cardId = $(this).closest(".rulings").data("card-id");
    $("#add-ruling-card-id").val(cardId);

    var converter = new Markdown.Converter();
    $("#add-ruling-form-text").on("keyup", function () {
      $("#add-ruling-form-preview").html(
        converter.makeHtml($("#add-ruling-form-text").val())
      );
    });

    enhanceTextarea("#add-ruling-form-text");
  }

  function delete_ruling() {
    var rulingId = $(this).closest("li").data("ruling-id");
    $("#delete-ruling-id").val(rulingId);
  }

  function edit_ruling() {
    var cardId = $(this).closest(".rulings").data("card-id");
    $("#edit-ruling-card-id").val(cardId);
    var rulingId = $(this).closest("li").data("ruling-id");
    var rulingText = $(this).closest("li").data("ruling-text");
    $("#edit-ruling-id").val(rulingId);
    $("#edit-ruling-form-text").val(rulingText);

    var converter = new Markdown.Converter();
    $("#edit-ruling-form-text").on("keyup", function () {
      $("#edit-ruling-form-preview").html(
        converter.makeHtml($("#edit-ruling-form-text").val())
      );
    });

    enhanceTextarea("#edit-ruling-form-text");
  }

  // TODO(plural): Share the preview functionality with the review method as well.
  function write_comment(event) {
    event.preventDefault();
    if (!user.data.is_authenticated) {
      alert("You must be logged in to leave a comment on a card.");
      return;
    }

    $(this).replaceWith(
      '<div class="input-group">' +
        '  <input type="text" class="form-control comment-form-text" name="comment" placeholder="Your comment">' +
        '    <span class="input-group-btn">' +
        '      <button class="btn btn-primary" type="submit">Post</button>' +
        "    </span>" +
        "</div>" +
        '<div class="well text-muted comment-form-preview">' +
        '  <small>Preview. Look <a href="http://daringfireball.net/projects/markdown/dingus">here</a> for a Markdown syntax reference.</small>' +
        "</div>"
    );

    var converter = new Markdown.Converter();
    $(".comment-form-text").on("keyup", function () {
      $(".comment-form-preview").html(
        converter.makeHtml($(".comment-form-text").val())
      );
    });

    enhanceTextarea(".comment-form-text");
  }

  function form_comment_submit(event) {
    event.preventDefault();
    var form = $(this);
    if (form.data("submitted")) return;
    form.data("submitted", true);
    $.ajax(form.attr("action"), {
      data: form.serialize(),
      type: "POST",
      dataType: "json",
      success: function (data) {
        if (data === true) {
          form.replaceWith(
            '<div class="alert alert-success" role="alert">Your comment has been posted. It will appear on the site in a few minutes.</div>'
          );
        } else {
          form.replaceWith(
            '<div class="alert alert-danger" role="alert">' + data + "</div>"
          );
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
        form.replaceWith(
          '<div class="alert alert-danger" role="alert">An error occured while posting your comment (' +
            jqXHR.statusText +
            "). Reload the page and try again.</div>"
        );
      },
    });
  }

  function setup_write() {
    $(".reviews-header").prepend(
      '<button class="pull-right btn btn-default review-button"><span class="glyphicon glyphicon-pencil"></span> Write a review</button>'
    );
  }

  function setup_edit() {
    var review_id = user.data.review_id;
    $("#review-" + review_id + " .review-text").append(
      '<button class="btn btn-default review-button"><span class="glyphicon glyphicon-pencil"></span> Edit review</a>'
    );
    $("input[name=review_id]").val(review_id);
  }

  function like_review(event) {
    event.preventDefault();
    if (!user.data.is_authenticated) {
      return;
    }
    var obj = $(this);
    var review_id = obj.closest("article.review").data("index");
    $.post(
      Routing.generate("card_review_like"),
      {
        id: review_id,
      },
      function (data) {
        obj.find(".num").text(data);
      }
    );
  }

  function write_review_open() {
    if (!user.data.is_authenticated) {
      alert("You must be logged in to write a card review.");
      return;
    }
    var form = $(".review-edit-form");
    $(this).remove();

    form.append(
      '<div><div class="form-group">' +
        '<textarea class="form-control review-form-text" rows="20" name="review" placeholder="Write your analysis of the card, in at least 200 characters. You can write a number of card reviews equal to your reputation. This is not a place for questions or comments. Type # to enter a card name. Type $ to enter a symbol."></textarea>' +
        '</div><div class="well text-muted review-form-preview"><small>Preview. Look <a href="http://daringfireball.net/projects/markdown/dingus">here</a> for a Markdown syntax reference.</small></div>' +
        '<button type="submit" class="btn btn-success">Submit review</button></div>'
    );

    form.on("submit", function (event) {
      event.preventDefault();
      if ($(".review-form-preview").text().length < 200) {
        alert("Your review must at least 200 characters long.");
        return;
      }
      var url = Routing.generate("card_review_post");
      if (user.data.review_id) {
        url = Routing.generate("card_review_edit");
      }
      var data = $(this).serialize();
      $.ajax(url, {
        data: data,
        type: "POST",
        dataType: "json",
        success: function (data) {
          if (data === true) {
            form.replaceWith(
              '<div class="alert alert-success" role="alert">Your review has been posted. It will appear on the site in a few minutes.</div>'
            );
          } else {
            form.replaceWith(
              '<div class="alert alert-danger" role="alert">An error occured while posting your review. ' +
                data +
                "</div>"
            );
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
          form.replaceWith(
            '<div class="alert alert-danger" role="alert">An error occured while posting your review (' +
              jqXHR.statusText +
              "). Reload the page and try again.</div>"
          );
        },
      });
    });

    var converter = new Markdown.Converter();
    $(".review-form-text").on("keyup", function () {
      $(".review-form-preview").html(
        converter.makeHtml($(".review-form-text").val())
      );
    });

    enhanceTextarea(".review-form-text");

    if (user.data.review_id) {
      $(".review-form-text").val(user.data.review_text).trigger("keyup");
    }
  }
}
