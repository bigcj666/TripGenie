from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from ..community import store

router = APIRouter(prefix="/api/community", tags=["community"])


class PublishBody(BaseModel):
    author: str = ""
    note: str = ""
    trip: dict = Field(default_factory=dict)


class CommentBody(BaseModel):
    author: str = ""
    body: str = ""


class RemoveBody(BaseModel):
    token: str = ""


@router.get("")
def feed(city: str | None = None) -> dict:
    chosen = city.strip() if city else None
    return {"posts": store.list_posts(chosen or None)}


@router.get("/{post_id}")
def read(post_id: str) -> dict:
    post = store.get_post(post_id)
    if post is None:
        raise HTTPException(status_code=404, detail="找不到这套分享")
    return post


@router.post("", status_code=201)
def publish(body: PublishBody) -> dict:
    try:
        return store.publish(body.author, body.note, body.trip)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/{post_id}/comments", status_code=201)
def comment(post_id: str, body: CommentBody) -> dict:
    try:
        return store.add_comment(post_id, body.author, body.body)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="找不到这套分享") from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/{post_id}/remove")
def remove(post_id: str, body: RemoveBody) -> dict:
    try:
        found = store.remove_post(post_id, body.token)
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail="只能撤回自己分享的攻略") from exc
    if not found:
        raise HTTPException(status_code=404, detail="找不到这套分享")
    return {"ok": True}
