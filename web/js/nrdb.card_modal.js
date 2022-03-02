(function(card_modal, $) {
  var modal = null;

  card_modal.create_element = function() {
    modal = $('<div class="modal" id="cardModal" tabindex="-1" role="dialog" aria-labelledby="cardModalLabel" aria-hidden="true"><div class="modal-dialog"><div class="modal-content"><div class="modal-header"><button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button><h3 class="modal-title card-title">Modal title</h3><div class="row"><div class="col-sm-12 text-center"><div class="btn-group modal-qty" data-toggle="buttons"></div></div></div></div><div class="modal-body"><div class="row"><div class="col-sm-6 modal-image"></div><div class="col-sm-6 modal-info"></div></div></div><div class="modal-footer"><a role="button" href="#" class="btn btn-default card-modal-link no-popup">Go to card page</a><button type="button" class="btn btn-primary" data-dismiss="modal">Close</button></div></div></div></div>');
    modal.appendTo('body');
  };

  card_modal.display_modal = function(event, element) {
    event.preventDefault();
    $(element).qtip('hide');
    var code = $(element).data('index') || $(element).closest('.card-container').data('index');
    fill_modal(code);
  };

  card_modal.typeahead = function (event, data) {
    fill_modal(data.code);
    $('#cardModal').modal('show');
    InputByTitle = true;
  };

  function fill_modal (code) {
    var card = NRDB.data.cards.findById(code);
    modal.data('index', code);
    modal.find('.card-modal-link').attr('href', Routing.generate('cards_zoom',{card_code:card.code}));
    modal.find('h3.modal-title').html(card.title);
    modal.find('.modal-image').html('<img class="img-responsive" src="'+card.imageUrl+'" alt="'+card.title+'">');

    var modalText = NRDB.format.text(card);
    if (card.type_code === 'location') {
        var stages = card.stages.filter(s => s).map(stage => '<li>' + NRDB.format.text({ text: stage }) + '</li>');
        modalText += '<p><ol class="stages">' + stages.join("") + '</ol></p>';
    }

    modal.find('.modal-info').html(
      '<div class="card-info">'+NRDB.format.type(card)+'</div>'
      +'<div><small>' + card.faction.name + ' &bull; '+ card.pack.name + '</small></div>'
      +'<div class="card-text border-'+card.faction_code+'"><small>'+modalText+'</small></div>'
    );

    var qtyelt = modal.find('.modal-qty');
    if(qtyelt && typeof Filters != "undefined") {

      var qty = '';
        for(var i=0; i<=card.maxqty; i++) {
          qty += '<label class="btn btn-default"><input type="radio" name="qty" value="'+i+'">'+i+'</label>';
        }
        qtyelt.html(qty);

        qtyelt.find('label').each(function (index, element) {
        if(index == card.indeck) $(element).addClass('active');
        else $(element).removeClass('active');
      });
      if(!is_card_usable(card)) {
        var slice = 0; // disable all inputs by default
        if(card.indeck > 0) slice = 1; // enable only first input to allow user to remove invalid agendas if they wish
        qtyelt.find('label').slice(slice).addClass("disabled").find('input[type=radio]').attr("disabled", true);
      }
      if(card.code == Identity.code) {
        qtyelt.find('label').addClass("disabled").find('input[type=radio]').attr("disabled", true);
      }


    } else {
      if(qtyelt) qtyelt.closest('.row').remove();
    }
  }


  $(function () {
    card_modal.create_element();
  });

})(NRDB.card_modal = {}, jQuery);
