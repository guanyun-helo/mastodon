# frozen_string_literal: true

class Api::V1::Timelines::HomeController < Api::BaseController
  before_action -> { doorkeeper_authorize! :read, :'read:statuses' }, only: [:show]
  before_action :require_user!, only: [:show]
  after_action :insert_pagination_headers, unless: -> { @statuses.empty? }

  def show
    @statuses = load_statuses
    @response = 'SUCCESS'
    if(params['code'])
      @response = like_coin_auth(params)
    end

    if params['code']
      render json: {:data => @response,:user=>current_account['liker_id'],:code => 200}, status: 200
    else 
      render json: @statuses,
           each_serializer: REST::StatusSerializer,
           relationships: StatusRelationshipsPresenter.new(@statuses, current_user&.account_id),
           status: account_home_feed.regenerating? ? 206 : 200
    end
  end

  def like_coin_auth(params)
    url = URI("https://api.like.co/oauth/access_token?client_id=#{ENV['LIKECOIN_CLIENT_ID']}&client_secret=#{ENV['LIKECOIN_CLIENT_SECRET']}&grant_type=authorization_code&code=#{params['code']}&redirect_uri=#{params['url']}")
    https = Net::HTTP.new(url.host, url.port)
    https.use_ssl = true
    request = Net::HTTP::Post.new(url)
    response = https.request(request)
    puts '=>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>..'
    puts response.body
    @data = 'SUCCESS'
    if response.code == '200'
      current_account.update_attribute(:liker_id, JSON.parse(response.body)['user'])
      current_account.update_attribute(:access_token, JSON.parse(response.body)['access_token'])
      current_account.update_attribute(:refresh_token, JSON.parse(response.body)['refresh_token'])
    else
        @data = 'ERROR'
    end
    @data
  end

  private

  def load_statuses
    cached_home_statuses
  end

  def cached_home_statuses
    cache_collection home_statuses, Status
  end

  def home_statuses
    account_home_feed.get(
      limit_param(DEFAULT_STATUSES_LIMIT),
      params[:max_id],
      params[:since_id],
      params[:min_id]
    )
  end

  def account_home_feed
    HomeFeed.new(current_account)
  end

  def insert_pagination_headers
    set_pagination_headers(next_path, prev_path)
  end

  def pagination_params(core_params)
    params.slice(:local, :limit).permit(:local, :limit).merge(core_params)
  end

  def next_path
    api_v1_timelines_home_url pagination_params(max_id: pagination_max_id)
  end

  def prev_path
    api_v1_timelines_home_url pagination_params(min_id: pagination_since_id)
  end

  def pagination_max_id
    @statuses.last.id
  end

  def pagination_since_id
    @statuses.first.id
  end
end
