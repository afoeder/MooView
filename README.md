## Use cases

### Model existing locally

```html
<ul
	data-mooview-data-source="script[data-parent-entity-uid=&quot;b7b3a925-1e1b-4d88-98d4-c08dbfdd31b6&quot;]">
</ul>

<script type="application/vnd.acme.commentCollection+json"
	data-parent-entity-uid="b7b3a925-1e1b-4d88-98d4-c08dbfdd31b6">
{"_elements":
	[
		{"author":"foo@bar.org","text":"This is a very nice blog posting."},
		{"author":"bar@foo.org","text":"This is the second comment."}
	]
}
</script>
```

The `data-mooview-data-source` attribute of the `ul` tells the engine which element selector to use for the data
retrieval. Furthermore, the Media type `application/vnd.acme.commentCollection+json` informs about what renderer to use,
in this case it will be resolved to `MooView.Conventional.Vendor.Acme.CommentCollectionView` (see section Conventional
Configuration for more details).



## Conventional Configuration

### Internet Media Type

The Internet Media Type of a data source tells which renderer to be used; currently the following scheme is supported:

`application/vnd.acme.commentCollection+json` would be searched in `MooView.Conventional.Vendor.Acme.CommentCollectionView`
(has to start with `vnd`, then the path will be followed, appended by `View`).