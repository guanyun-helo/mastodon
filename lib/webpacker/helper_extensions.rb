# frozen_string_literal: true

module Webpacker::HelperExtensions
  def javascript_pack_tag(name, **options)
    src, integrity = current_webpacker_instance.manifest.lookup!(name, type: :javascript, with_integrity: true)
    javascript_include_tag(src, options.merge(integrity: integrity))
  end

  def ga_pack_tag(name)
    script = "window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'UA-197581231-1');
    "
    javascript_tag(script,{ nonce: name, crossorigin: 'anonymous' })
  end

  def gam_pack_tag(src)
    javascript_tag('',{ src: src, async: true })
  end

  def umami_pack_tag(src)
    javascript_tag('',{ src: src, async: true, 'data-website-id': '02a8473b-5bb7-47fe-8868-80eb330c43ec' })
  end

  def stylesheet_pack_tag(name, **options)
    src, integrity = current_webpacker_instance.manifest.lookup!(name, type: :stylesheet, with_integrity: true)
    stylesheet_link_tag(src, options.merge(integrity: integrity))
  end

  def preload_pack_asset(name, **options)
    src, integrity = current_webpacker_instance.manifest.lookup!(name, with_integrity: true)

    # This attribute will only work if the assets are on a different domain.
    # And Webpack will (correctly) only add it in this case, so we need to conditionally set it here
    # otherwise the preloaded request and the real request will have different crossorigin values
    # and the preloaded file wont be loaded
    crossorigin = 'anonymous' if Rails.configuration.action_controller.asset_host.present?

    preload_link_tag(src, options.merge(integrity: integrity, crossorigin: crossorigin))
  end
end

Webpacker::Helper.prepend(Webpacker::HelperExtensions)
