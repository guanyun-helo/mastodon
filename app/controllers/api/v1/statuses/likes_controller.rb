# frozen_string_literal: true
require 'net/http'
require 'uri'

class Api::V1::Statuses::LikesController < Api::BaseController
    include Authorization
    include Redisable
    EXPIRE_AFTER = 24.hours.seconds

    before_action -> { doorkeeper_authorize! :write, :'write:favourites',:support }
    before_action :require_user!
    before_action :set_status, only: [:create,:like_count,:support,:support_likers]
    print ENV['LIKE_CLIENT_ID']
    def create
        @path = params['path']
        response = 'ok'
        if current_account['refresh_token']
          puts current_account['refresh_token']
          response = like_content(@path,params['count'])
          if response.code != '200'
            access_token_response = access_token()
            if access_token_response.code == '200'
              response = like_content(@path,params['count'])
            end
          end
          if response.body == 'OK'
            if redis.get("#{current_account.id}#{@status.id}")
              puts 'add =>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>'
              puts response.body
              puts params['count']
              redis.incrby("#{current_account.id}#{@status.id}", params['count'])
              redis.expire("#{current_account.id}#{@status.id}", EXPIRE_AFTER)
            else
              redis.set("#{current_account.id}#{@status.id}", params['count'])
              redis.expire("#{current_account.id}#{@status.id}", EXPIRE_AFTER)
            end
          end
        else
          response = nil
        end
        if current_account['refresh_token']
          render json: {:data=> response.body,:code => 200}, status: 200
        else
          render json: {:url => response,:data=>@status,:code => 401}, status: 200
        end
    end

    def support
      support_status = Status.find(JSON.parse(request.raw_post)['statusId'])

      @likers = []

      if support_status['support_likers'].nil?
        Status.find(support_status.id).update_attribute(:support_likers, [])
        support_status['support_likers'] = []
      else
        @likers = support_status['support_likers']
      end
      puts '=>?>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>'
      puts support_status['support_likers'].nil?
      puts @likers.nil?

      if support_status['support_likers'].find_index{ |i| i == JSON.parse(request.raw_post)['liker'] }
        index = support_status['support_likers'].find_index{ |i| i == JSON.parse(request.raw_post)['liker'] }
        @likers = @likers[0,index].concat(@likers[index+1..-1])
        @likers.push(JSON.parse(request.raw_post)['liker'])
      else
        @likers.push(JSON.parse(request.raw_post)['liker'])
      end
      Status.find(support_status.id).update_attribute(:support_likers, @likers)
      render json: {:data=>@likers,:code => 200}, status: 200
    end


    def support_likers
      support_status = Status.find(params['statusId'])
      render json: {:data=>support_status.support_likers,:code => 200}, status: 200
    end

    def like_coin_auth
      query = {:client_id => ENV['LIKECOIN_CLIENT_ID'],:scope => 'profile read:like.button write:like.button',:redirect_uri => params['origin']}

      uri = URI('https://like.co/in/oauth/')
      uri.query = URI.encode_www_form(query)
      
      res = Net::HTTP.get_response(uri)

      case res
      when Net::HTTPSuccess     then puts 'get url'
      when Net::HTTPRedirection then @status.url = res['location']
      end
      # render json: {:url => res['location'],:data=>@status,:code => 301}, status: 200
      res
    end

    def bind_like_coin_id
    end
    
    def like_content(path,count)
      @referrer = "#@path/web/statuses/#{params[:status_id]}"
      url = URI("https://api.like.co/like/likebutton/#{Account.find(@status['account_id'])['liker_id']}/#{count}?client_id=#{ENV['LIKECOIN_CLIENT_ID']}&client_secret=#{ENV['LIKECOIN_CLIENT_SECRET']}&referrer=#@referrer")

      https = Net::HTTP.new(url.host, url.port)
      https.use_ssl = true
      x_request = Net::HTTP::Post.new(url, {'Authorization' => "Bearer #{current_account['access_token']}",'x-likecoin-real-ip'=>request.remote_ip,'x-likecoin-user-agent'=>request.user_agent})
      response = https.request(x_request)
      response
    end

    def access_token()
      refresh_url = URI("https://api.like.co/oauth/access_token")

      https = Net::HTTP.new(refresh_url.host, refresh_url.port)
      https.use_ssl = true

      x_request = Net::HTTP::Post.new(refresh_url)
      x_request["Content-Type"] = "application/x-www-form-urlencoded"
      x_request.body = "client_id=#{ENV['LIKECOIN_CLIENT_ID']}&client_secret=#{ENV['LIKECOIN_CLIENT_SECRET']}&grant_type=refresh_token&refresh_token=#{current_account.refresh_token}"

      response = https.request(x_request)
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
      if redis.get("#{current_account.id}#{@status.id}")
        render json: {:data=> "{\"count\":#{redis.get("#{current_account.id}#{@status.id}")}}",:code => 200}, status: 200
        return
      end
      if Account.find(@status['account_id'])['liker_id'] == nil
        return
      end
      @path = params['path']
      @referrer = "#@path/web/statuses/#{params[:status_id]}"
      url = URI("https://api.like.co/like/likebutton/#{Account.find(@status['account_id'])['liker_id']}/self?client_id=#{ENV['LIKECOIN_CLIENT_ID']}&client_secret=#{ENV['LIKECOIN_CLIENT_SECRET']}&referrer=#@referrer")

      https = Net::HTTP.new(url.host, url.port)
      https.use_ssl = true
      x_request = Net::HTTP::Get.new(url, {'Authorization' => "Bearer #{current_account['access_token']}"})

      response = https.request(x_request)
      if response.code != '200'
        access_token_response = access_token()
        if access_token_response.code == '200'
          response = https.request(x_request)
        end
      end
      # if JSON.parse(response.body)['count'] > 0
      redis.set("#{current_account.id}#{@status.id}", JSON.parse(response.body)['count'])
      redis.expire("#{current_account.id}#{@status.id}", EXPIRE_AFTER)
      # end
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
  