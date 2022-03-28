# frozen_string_literal: true

class Api::V1::Statuses::IscnsController < Api::BaseController
    include Authorization
  
    before_action -> { doorkeeper_authorize! :write, :'write:iscns' }
    before_action :require_user!
    before_action :set_status, only: [:create]

    def create
        Status.find(@status.id).update_attribute(:iscn_id, params['iscn_id'])
        render json: Status.find(@status.id), serializer: REST::StatusSerializer
    end
  
    def destroy
      bookmark = current_account.bookmarks.find_by(status_id: params[:status_id])
  
      if bookmark
        @status = bookmark.status
      else
        @status = Status.find(params[:status_id])
        authorize @status, :show?
      end
  
      bookmark&.destroy!
  
      render json: @status, serializer: REST::StatusSerializer, relationships: StatusRelationshipsPresenter.new([@status], current_account.id, bookmarks_map: { @status.id => false })
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
  