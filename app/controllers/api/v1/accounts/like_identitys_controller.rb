# frozen_string_literal: true
require 'net/http'
require 'uri'

# frozen_string_literal: true
class Api::V1::Accounts::LikeIdentitysController < Api::BaseController
  include Authorization
  
  before_action -> { doorkeeper_authorize! :write, :'write:favourites' }
  before_action :require_user!
  before_action :set_status, only: [:create,:like_coin_auth]
  print ENV['LIKE_CLIENT_ID']

  def index
    response = like_coin_auth()
    render json: {:url => response['location'],:data=>@status,:code => 301}, status: 200
  end

  def like_coin_auth
    query = {:client_id => ENV['LIKECOIN_CLIENT_ID'],:scope => 'profile read:like.button write:like.button',:redirect_uri => params['origin']}

    uri = URI('https://like.co/in/oauth/')
    uri.query = URI.encode_www_form(query)
    
    res = Net::HTTP.get_response(uri)

    case res
    when Net::HTTPSuccess     then puts 'get url'
    end
    res
  end

  def access_token()
    refresh_url = URI("https://api.like.co/oauth/access_token")

    https = Net::HTTP.new(refresh_url.host, refresh_url.port)
    https.use_ssl = true

    request = Net::HTTP::Post.new(refresh_url)
    request["Content-Type"] = "application/x-www-form-urlencoded"
    request.body = "client_id=#{ENV['LIKECOIN_CLIENT_ID']}&client_secret=#{ENV['LIKECOIN_CLIENT_SECRET']}&grant_type=refresh_token&refresh_token=#{current_account.refresh_token}"

    response = https.request(request)
    Account.find(current_account.id).update_attribute(:access_token, JSON.parse(response.body)['access_token'])
    response
  end

  def fetch(uri_str,params, limit = 10)
      # You should choose better exception.
      raise ArgumentError, 'HTTP redirect too deep' if limit == 0
    
      url = URI.parse(uri_str)
      url.query = URI.encode_www_form(params)
      req = Net::HTTP::Get.new(url.path, { 'User-Agent' => 'Mozilla/5.0 (etc...)' })
      response = Net::HTTP.start(url.host, url.port, use_ssl: true) { |http| http.request(req) }
      case response
      when Net::HTTPSuccess     then response
      when Net::HTTPRedirection then fetch(response['location'], limit - 1)
      else
        response
      end
  end

  def like_count
    @path = params['path']
    @referrer = "#@path/web/statuses/#{params[:status_id]}"
    url = URI("https://api.like.co/like/likebutton/#{Account.find(@status['account_id'])['liker_id']}/self?client_id=#{ENV['LIKECOIN_CLIENT_ID']}&client_secret=#{ENV['LIKECOIN_CLIENT_SECRET']}&referrer=#@referrer")

    https = Net::HTTP.new(url.host, url.port)
    https.use_ssl = true
    request = Net::HTTP::Get.new(url, {'Authorization' => "Bearer #{current_account['access_token']}"})

    response = https.request(request)

    if response.code != '200'
      access_token_response = access_token()
      if access_token_response.code == '200'
        response = like_content(@path,params['count'])
      end
    end
    render json: {:data=> response.body,:code => 200}, status: 200
  end

  def destroy
    fav = current_account.favourites.find_by(status_id: params[:status_id])

    if fav
      @status = fav.status
      UnfavouriteWorker.perform_async(current_account.id, @status.id)
    else
      @status = Status.find(params[:status_id])
      authorize @status, :show?
    end

    render json: @status, serializer: REST::StatusSerializer, relationships: StatusRelationshipsPresenter.new([@status], current_account.id, favourites_map: { @status.id => false })
  rescue Mastodon::NotPermittedError
    not_found
  end

  private

  def set_status
    @status = Status.find(params[:status_id])
    authorize @status, :show?
  rescue Mastodon::NotPermittedError
    not_found
  end
end

  