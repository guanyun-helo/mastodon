# frozen_string_literal: true

class Api::V1::Timelines::HomeController < Api::V1::Timelines::BaseController
  before_action -> { doorkeeper_authorize! :read, :'read:statuses' }, only: [:show]
  before_action :require_user!, only: [:show]

  PERMITTED_PARAMS = %i(local limit).freeze


  def show
    with_read_replica do
      @statuses = load_statuses
      @relationships = StatusRelationshipsPresenter.new(@statuses, current_user&.account_id)
    end

    if params['code']
      render json: {:data => like_coin_auth(params) ,:user=>current_account['liker_id'],:code => 200}, status: 200
    else 
      render json: @statuses,
           each_serializer: REST::StatusSerializer,
           relationships: @relationships,
           status: account_home_feed.regenerating? ? 206 : 200
    end
  end

  def like_coin_auth(params)
    redirect_uri = Rails.env.development? ? 'https://liker.social/home' : params['url']
    url = URI("https://api.like.co/oauth/access_token?client_id=#{ENV['LIKECOIN_CLIENT_ID']}&client_secret=#{ENV['LIKECOIN_CLIENT_SECRET']}&grant_type=authorization_code&code=#{params['code']}&redirect_uri=#{redirect_uri}")
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
    preloaded_home_statuses
  end

  def preloaded_home_statuses
    preload_collection home_statuses, Status
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

  def next_path
    api_v1_timelines_home_url next_path_params
  end

  def prev_path
    api_v1_timelines_home_url prev_path_params
  end
end
